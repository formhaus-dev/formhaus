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
const size: FormField = { key: 'size', type: 'number', label: 'Size', defaultValue: 2 };

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

const toggle = (engine: FormEngine, key = 'on') => {
  engine.setValue(key, false);
  engine.setValue(key, true);
};

describe('last values of fields shown again', () => {
  it('gives back a typed value', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', 'B2');
    engine.setValue('on', false);
    expect(engine.getSubmitValues()).toEqual({ on: false });
    engine.setValue('on', true);
    expect(engine.getSubmitValues()).toEqual({ on: true, code: 'B2' });
  });

  it('gives back an explicit clear instead of the default', () => {
    const engine = new FormEngine(toggled(code, size), { on: true });
    engine.setValue('code', '');
    engine.setValue('size', null);
    toggle(engine);
    expect(engine.values).toEqual({ on: true, code: '', size: null });
  });

  it('keeps a value set to undefined empty', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', undefined);
    toggle(engine);
    expect(engine.values).toEqual({ on: true });
  });

  it('gives back the last value after several edits', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', 'B2');
    engine.setValue('code', 'A1');
    toggle(engine);
    engine.setValue('code', 'C3');
    toggle(engine);
    expect(engine.values.code).toBe('C3');
  });

  it('remembers a value set while the field is hidden', () => {
    const engine = new FormEngine(toggled(code));
    engine.setValue('code', 'B2');
    expect(engine.values).not.toHaveProperty('code');
    engine.setValue('on', true);
    expect(engine.values.code).toBe('B2');
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

  it('gives an item field its last value inside a group shown again', () => {
    const engine = new FormEngine(crew, { on: true, crew: [{ kind: 'x' }] });
    engine.setValue('crew.0.count', 4);
    engine.setValue('crew.0.kind', 'y');
    toggle(engine);
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 4 }]);
  });

  it('remembers an item field cleared to undefined while it is hidden', () => {
    const engine = new FormEngine(crew, { on: true, crew: [{ kind: 'x' }] });
    engine.setValue('crew.0.count', 4);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.count', undefined);
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x' }]);
  });

  it('forgets a removed item', () => {
    const engine = new FormEngine(crew, { on: true, crew: [{ kind: 'x' }, { kind: 'x' }] });
    engine.setValue('crew.0.count', 4);
    engine.setValue('crew.0.kind', 'y');
    engine.removeItem('crew', 0);
    engine.setValue('crew.0.kind', 'y');
    engine.setValue('crew.0.kind', 'x');
    expect(engine.values.crew).toEqual([{ kind: 'x', count: 1 }]);
  });

  it('forgets everything on reset', () => {
    const engine = new FormEngine(toggled(code), { on: true });
    engine.setValue('code', 'B2');
    engine.reset({ on: true });
    expect(engine.values.code).toBe('A1');
    engine.setValue('code', 'C3');
    engine.setValue('on', false);
    engine.reset();
    engine.setValue('on', true);
    expect(engine.values.code).toBe('A1');
  });

  it('starts fresh from initialValues in a new engine', () => {
    const first = new FormEngine(toggled(code), { on: true });
    first.setValue('code', 'B2');
    first.setValue('on', false);
    const draft = new FormEngine(toggled(code), first.getSubmitValues());
    draft.setValue('on', true);
    expect(draft.values.code).toBe('A1');
  });

  it('keeps the start value of a hidden-type field', () => {
    const engine = new FormEngine(toggled({ key: 'source', type: 'hidden', defaultValue: 'ad' }), { on: true });
    engine.setValue('source', 'other');
    toggle(engine);
    expect(engine.values.source).toBe('ad');
  });

  it('does not restore on the server what the payload hid or left out', () => {
    expect(validateSubmission(toggled(code), { on: false, code: 'B2' }).values).toEqual({ on: false });
    expect(validateSubmission(toggled(code), { on: true }).values).toEqual({ on: true });
    expect(validateSubmission(crew, { on: true, crew: [{ kind: 'y', count: 4 }] }).values).toEqual({ on: true, crew: [{ kind: 'y' }] });
  });
});
