import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormField } from '../../src/types';

const toggled = (...fields: FormField[]): FormDefinition => ({
  id: 'toggled',
  title: 'Toggled',
  submit: { label: 'Send' },
  fields: [{ key: 'on', type: 'checkbox', label: 'On' }, ...fields.map((field) => ({ ...field, show: [{ field: 'on', eq: true }] }))],
});

const code: FormField = { key: 'code', type: 'text', label: 'Code', defaultValue: 'A1' };

const crew: FormDefinition = {
  id: 'crew',
  title: 'Crew',
  submit: { label: 'Send' },
  fields: [
    { key: 'on', type: 'checkbox', label: 'On' },
    {
      key: 'crew',
      type: 'group',
      label: 'Crew',
      show: [{ field: 'on', eq: true }],
      fields: [
        { key: 'kind', type: 'text', label: 'Kind' },
        { key: 'count', type: 'number', label: 'Count', defaultValue: 1, show: [{ field: 'kind', eq: 'x' }] },
      ],
    },
  ],
};

const finalSkip: FormDefinition = {
  id: 'final-skip',
  title: 'Final skip',
  submit: { label: 'Send' },
  steps: [
    { id: 'start', title: 'Start', fields: [{ key: 'on', type: 'checkbox', label: 'On' }] },
    { id: 'extra', title: 'Extra', skip: { label: 'Later' }, fields: [{ ...code, show: [{ field: 'on', eq: true }] }] },
  ],
};

const toggle = (engine: FormEngine, key = 'on') => {
  engine.setValue(key, false);
  engine.setValue(key, true);
};

describe('last values of fields shown again', () => {
  it('keeps a value set to undefined empty', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', undefined);
    toggle(engine);
    expect(engine.values).toEqual({ on: true });
  });

  it('remembers a clear to undefined made while the field is hidden', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', 'B2');
    engine.setValue('on', false);
    engine.setValue('code', undefined);
    engine.setValue('on', true);
    expect(engine.values).toEqual({ on: true });
  });

  it('keeps a group set to undefined empty', () => {
    const engine = new FormEngine(
      toggled({ key: 'crew', type: 'group', label: 'Crew', defaultItems: 2, fields: [{ key: 'kind', type: 'text', label: 'Kind' }] }),
      { on: true },
    );
    engine.setValue('crew', undefined);
    toggle(engine);
    expect(engine.values).toEqual({ on: true });
  });

  it('gives a group its last items with the same item ids', () => {
    const engine = new FormEngine(crew, { on: true, crew: [{ kind: 'a' }] });
    engine.addItem('crew');
    engine.setValue('crew.1.kind', 'b');
    const ids = engine.items('crew').map(({ id }) => id);
    engine.setValue('on', false);
    expect(engine.values).toEqual({ on: false });
    engine.setValue('on', true);
    expect(engine.values.crew).toEqual([{ kind: 'a' }, { kind: 'b' }]);
    expect(engine.items('crew').map(({ id }) => id)).toEqual(ids);
  });

  it('remembers an item field cleared to undefined while it is hidden', () => {
    const engine = new FormEngine(crew, { on: true, crew: [{ kind: 'x' }] });
    engine.setValue('crew.0.count', 4);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.count', undefined);
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x' }]);
  });

  it('keeps a write made to a hidden field while a rejected Skip was pending', async () => {
    const engine = new FormEngine(finalSkip, { on: true });
    await engine.next();
    engine.setValue('code', 'B2');
    engine.setValue('on', false);
    let reject = () => {};
    const skipping = engine.skip(() => new Promise((resolve) => (reject = () => resolve({ ok: false }))));
    engine.setValue('code', undefined);
    reject();
    expect(await skipping).toBe(false);
    engine.setValue('on', true);
    expect(engine.values).toEqual({ on: true });
  });

  it('keeps a clear of a shown field made while a rejected Skip was pending', async () => {
    const definition: FormDefinition = {
      ...finalSkip,
      steps: [finalSkip.steps![0], { ...finalSkip.steps![1], fields: [{ key: 'code', type: 'text', label: 'Code' }] }],
    };
    const engine = new FormEngine(definition, { on: true });
    await engine.next();
    engine.setValue('code', 'B2');
    let reject = () => {};
    const skipping = engine.skip(() => new Promise((resolve) => (reject = () => resolve({ ok: false }))));
    engine.setValue('code', undefined);
    reject();
    expect(await skipping).toBe(false);
    let sent: Record<string, unknown> = {};
    await engine.submit(async (values) => {
      sent = values;
    });
    expect(sent.code).toBeUndefined();
  });

  it('does not restore on the server what the payload hid or left out', () => {
    expect(validateSubmission(toggled(code), { on: false, code: 'B2' }).values).toEqual({ on: false });
    expect(validateSubmission(toggled(code), { on: true }).values).toEqual({ on: true });
    expect(validateSubmission(crew, { on: true, crew: [{ kind: 'y', count: 4 }] }).values).toEqual({ on: true, crew: [{ kind: 'y' }] });
  });
});
