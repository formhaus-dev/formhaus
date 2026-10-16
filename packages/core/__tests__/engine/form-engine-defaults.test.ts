import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormField } from '../../src/types';

const rsvp: FormDefinition = {
  id: 'rsvp',
  title: 'RSVP',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'reply',
      title: 'Reply',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        {
          key: 'attending',
          type: 'radio',
          label: 'Coming?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          validation: { required: true },
        },
      ],
    },
    {
      id: 'details',
      title: 'Details',
      show: [{ field: 'attending', eq: 'yes' }],
      fields: [
        { key: 'partySize', type: 'number', label: 'Party size', defaultValue: 1, validation: { required: true, min: 1 } },
        { key: 'note', type: 'text', label: 'Note' },
      ],
    },
  ],
};

const toggled = (field: FormField): FormDefinition => ({
  id: 'toggled',
  title: 'Toggled',
  submit: { label: 'Send' },
  fields: [
    { key: 'on', type: 'checkbox', label: 'On' },
    { ...field, show: [{ field: 'on', eq: true }] },
  ],
});

const crew: FormDefinition = {
  id: 'crew',
  title: 'Crew',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'crew',
      type: 'group',
      label: 'Crew',
      fields: [
        {
          key: 'kind',
          type: 'select',
          label: 'Kind',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
        { key: 'count', type: 'number', label: 'Count', defaultValue: 1, show: [{ field: 'kind', eq: 'x' }] },
      ],
    },
  ],
};

const skippable = (final: boolean): FormDefinition => ({
  id: 'skippable',
  title: 'Skippable',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'plan',
      title: 'Plan',
      fields: [
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          options: [
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro' },
          ],
        },
      ],
    },
    {
      id: 'seats',
      title: 'Seats',
      skip: { label: 'Later' },
      fields: [{ key: 'seats', type: 'number', label: 'Seats', defaultValue: 1, show: [{ field: 'plan', eq: 'pro' }] }],
    },
    ...(final ? [] : [{ id: 'end', title: 'End', fields: [{ key: 'end', type: 'text' as const, label: 'End' }] }]),
  ],
});

describe('defaults of fields that start hidden or are shown again', () => {
  it('gives a field on a step shown later its defaultValue and submits it', async () => {
    const engine = new FormEngine(rsvp);
    expect(engine.values).toEqual({});
    engine.setValue('name', 'Ada');
    engine.setValue('attending', 'yes');
    expect(engine.values.partySize).toBe(1);
    expect(await engine.next()).toBe(true);
    const onSubmit = vi.fn();
    expect(await engine.submit(onSubmit)).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', attending: 'yes', partySize: 1 }, []);
  });

  it('restores the default after the step is hidden and shown again', () => {
    const engine = new FormEngine(rsvp, { attending: 'yes' });
    engine.setValue('attending', 'no');
    expect(engine.values).not.toHaveProperty('partySize');
    engine.setValue('attending', 'yes');
    expect(engine.values.partySize).toBe(1);
  });

  it('starts an edited field empty when it is shown again', () => {
    const engine = new FormEngine(rsvp, { attending: 'yes' });
    engine.setValue('partySize', 3);
    engine.setValue('attending', 'no');
    engine.setValue('attending', 'yes');
    expect(engine.values).not.toHaveProperty('partySize');
  });

  it('counts an edit back to the default as an edit', () => {
    const engine = new FormEngine(rsvp, { attending: 'yes' });
    engine.setValue('partySize', 3);
    engine.setValue('partySize', 1);
    engine.setValue('attending', 'no');
    engine.setValue('attending', 'yes');
    expect(engine.values).not.toHaveProperty('partySize');
  });

  it('keeps an unchecked checkbox unchecked', () => {
    const engine = new FormEngine(toggled({ key: 'terms', type: 'checkbox', label: 'Terms', defaultValue: true }), { on: true });
    engine.setValue('terms', false);
    engine.setValue('on', false);
    engine.setValue('on', true);
    expect(engine.values).not.toHaveProperty('terms');
    expect(engine.getSubmitValues()).toEqual({ on: true });
  });

  it('gives back an initial value of a field hidden at load', () => {
    const engine = new FormEngine(rsvp, { attending: 'no', partySize: 4, note: 'vegan' });
    expect(engine.values).toEqual({ attending: 'no' });
    engine.setValue('attending', 'yes');
    expect(engine.values).toEqual({ attending: 'yes', partySize: 4, note: 'vegan' });
  });

  it('does not fall back from an empty initial value to the default', () => {
    const engine = new FormEngine(rsvp, { attending: 'no', partySize: null });
    engine.setValue('attending', 'yes');
    expect(engine.values.partySize).toBeNull();
  });

  it('drops a server error of a field whose default comes back', () => {
    const engine = new FormEngine(toggled({ key: 'code', type: 'text', label: 'Code', defaultValue: 'A1' }), { on: true });
    engine.setErrors({ code: 'Taken' });
    engine.setValue('on', false);
    engine.setValue('on', true);
    expect(engine.values.code).toBe('A1');
    expect(engine.errors).toEqual({});
  });

  it('gives an item field its default when its item condition matches', () => {
    const engine = new FormEngine(crew);
    engine.addItem('crew');
    expect(engine.values.crew).toEqual([{}]);
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 1 }]);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 1 }]);
  });

  it('starts an edited item field empty when its item condition matches again', () => {
    const engine = new FormEngine(crew, { crew: [{ kind: 'x', count: 2 }] });
    engine.setValue('crew.0.count', 5);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x' }]);
  });

  it('tracks item edits by item, not by position', () => {
    const engine = new FormEngine(crew, {
      crew: [
        { kind: 'x', count: 2 },
        { kind: 'x', count: 3 },
      ],
    });
    engine.setValue('crew.0.count', 5);
    engine.removeItem('crew', 0);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 3 }]);
  });

  it('resets a skipped step to its defaults and forgets its edits', async () => {
    const engine = new FormEngine(skippable(false), { plan: 'pro', seats: 5 });
    await engine.next();
    engine.setValue('seats', 7);
    expect(await engine.skip()).toBe(true);
    expect(engine.values.seats).toBe(1);
    engine.setValue('plan', 'free');
    engine.setValue('plan', 'pro');
    expect(engine.values.seats).toBe(1);
  });

  it('restores edits and seeds when a final-step Skip is rejected', async () => {
    const engine = new FormEngine(skippable(true), { plan: 'pro', seats: 5 });
    await engine.next();
    engine.setValue('seats', 7);
    expect(await engine.skip(() => ({ ok: false }))).toBe(false);
    expect(engine.values.seats).toBe(7);
    engine.setValue('plan', 'free');
    engine.setValue('plan', 'pro');
    expect(engine.values).not.toHaveProperty('seats');
  });

  it('restores the draft value after a rejected final-step Skip of an untouched step', async () => {
    const engine = new FormEngine(skippable(true), { plan: 'pro', seats: 5 });
    await engine.next();
    expect(await engine.skip(() => ({ ok: false }))).toBe(false);
    expect(engine.values.seats).toBe(5);
    engine.setValue('plan', 'free');
    engine.setValue('plan', 'pro');
    expect(engine.values.seats).toBe(5);
  });

  it('does not restore an item value the server rejected', () => {
    const result = validateSubmission(crew, { crew: [{ kind: 'x', count: 'many' }] });
    expect(result.values).toEqual({ crew: [{ kind: 'x' }] });
    expect(result.errors).toHaveProperty(['crew.0.count']);
  });
});
