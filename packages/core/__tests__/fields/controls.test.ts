import { describe, expect, it, vi } from 'vitest';
import type { FormField } from '../../src';
import { controlKind, controlOptions, controlProps, controlShell, fromControl, mapControlTypes, toControl } from '../../src/controls';
import { fieldState } from '../../src/fields';
import { validateFieldValue } from '../../src';

const field = (type: string, overrides: Partial<FormField> = {}): FormField => ({ key: type, type, label: type, ...overrides });
const event = (target: Record<string, unknown>) => ({ target, preventDefault() {} });

describe('controlKind and controlShell', () => {
  it('maps types to kinds and lets kinds override them', () => {
    expect(
      ['text', 'select', 'file', 'x-custom', 'checkbox', 'switch', 'radio', 'multiselect', 'scale', 'rating'].map((type) =>
        controlKind(type),
      ),
    ).toEqual(['input', 'input', 'input', 'input', 'inline', 'inline', 'group', 'group', 'group', 'group']);
    expect(controlKind('multiselect', { multiselect: 'input' })).toBe('input');
  });

  it('does not read inherited properties for a type', () => {
    const types = ['constructor', '__proto__', 'toString'];
    expect(types.map((type) => controlKind(type))).toEqual(['input', 'input', 'input']);
    expect(types.map((type) => controlKind(type, {}))).toEqual(['input', 'input', 'input']);
    expect(types.map((type) => toControl(field(type), 'x'))).toEqual(['x', 'x', 'x']);
    expect(types.map((type) => fromControl(field(type), event({ value: 'x', checked: true })))).toEqual(['x', 'x', 'x']);
  });

  it('reads one shell, a shell per kind, or null', () => {
    const one = () => null;
    expect(controlShell(one, 'group')).toBe(one);
    expect(controlShell(null, 'input')).toBeNull();
    expect([controlShell({ group: one }, 'group'), controlShell({ group: one }, 'input'), controlShell({ input: null }, 'input')]).toEqual([
      one,
      null,
      null,
    ]);
  });
});

describe('mapControlTypes', () => {
  it('expands input to the text types unless a type has its own entry', () => {
    const map = mapControlTypes({ input: 'Input', password: 'Password', radio: undefined }, (entry, input) => `${entry}:${input}`);
    expect(map).toEqual({
      password: 'Password:false',
      text: 'Input:true',
      email: 'Input:true',
      phone: 'Input:true',
      number: 'Input:true',
      date: 'Input:true',
      time: 'Input:true',
      datetime: 'Input:true',
    });
  });

  it('builds one component per entry', () => {
    const make = vi.fn((entry: string) => ({ entry }));
    const map = mapControlTypes({ input: 'Input' }, make);
    expect([make.mock.calls.length, map.text === map.email]).toEqual([1, true]);
  });
});

describe('toControl', () => {
  it('shows the value in the shape a control takes', () => {
    expect([toControl(field('text'), null), toControl(field('number'), 4), toControl(field('select'), undefined)]).toEqual(['', '4', '']);
    expect([toControl(field('checkbox'), undefined), toControl(field('switch'), true)]).toEqual([false, true]);
    expect([toControl(field('multiselect'), 'a'), toControl(field('multiselect'), ['a'])]).toEqual([[], ['a']]);
    expect([toControl(field('scale'), 3), toControl(field('radio'), undefined), toControl(field('file'), null)]).toEqual([
      3,
      null,
      undefined,
    ]);
  });
});

describe('fromControl', () => {
  it('reads events, a second argument and bare values', () => {
    expect(fromControl(field('text'), event({ value: 'Ada' }))).toBe('Ada');
    expect(fromControl(field('checkbox'), event({ checked: true, value: 'on' }))).toBe(true);
    expect(fromControl(field('radio'), event({ value: 'x' }), 'b')).toBe('b');
    expect(fromControl(field('switch'), true)).toBe(true);
    expect(fromControl(field('text'), undefined)).toBeNull();
  });

  it('writes numbers core accepts', () => {
    expect(['42', '', '1e3', '0x10'].map((text) => fromControl(field('number'), event({ value: text })))).toEqual([42, null, 1000, '0x10']);
    expect(fromControl(field('number'), 7)).toBe(7);
    expect(['3', 3, '7'].map((value) => fromControl(field('scale'), value))).toEqual([3, 3, 7]);
    expect([fromControl(field('rating'), 0), fromControl(field('scale'), 0), fromControl(field('rating'), null)]).toEqual([null, 0, null]);
  });

  it('writes dates from Date objects and date library objects', () => {
    const day = new Date(2026, 0, 5, 9, 7);
    expect([fromControl(field('date'), day), fromControl(field('datetime'), day), fromControl(field('time'), day)]).toEqual([
      '2026-01-05',
      '2026-01-05T09:07',
      '09:07',
    ]);
    expect(fromControl(field('date'), { toDate: () => day })).toBe('2026-01-05');
    expect([
      fromControl(field('date'), new Date(Number.NaN)),
      fromControl(field('date'), '2026-02-01'),
      fromControl(field('date'), null),
    ]).toEqual([null, '2026-02-01', null]);
  });

  it('unwraps option objects and files', () => {
    expect(fromControl(field('autocomplete'), { value: 'nl', label: 'Netherlands' })).toBe('nl');
    expect(fromControl(field('multiselect'), [{ value: 'a' }, 'b'])).toEqual(['a', 'b']);
    const file = { name: 'cv.pdf' };
    expect([
      fromControl(field('file'), event({ files: [file] })),
      fromControl(field('file'), [file]),
      fromControl(field('file'), file),
    ]).toEqual([file, file, file]);
    expect([fromControl(field('file'), event({ files: [] })), fromControl(field('file'), undefined)]).toEqual([null, null]);
  });

  it('writes values that pass validation', () => {
    const cases: [FormField, unknown][] = [
      [field('number'), event({ value: '12.5' })],
      [field('scale', { validation: { min: 0, max: 10 } }), '0'],
      [field('rating'), 4],
      [field('datetime'), new Date(2026, 5, 1, 23, 59)],
      [field('multiselect', { options: [{ value: 'a', label: 'A' }] }), [{ value: 'a', label: 'A' }]],
    ];
    for (const [control, input] of cases) expect(validateFieldValue(control, fromControl(control, input))).toBeNull();
  });
});

describe('controlOptions and controlProps', () => {
  it('gives scale points as options and keeps other options', () => {
    const options = [{ value: '1', label: 'Low' }];
    expect(controlOptions(field('scale', { validation: { min: 1, max: 3 }, options }), options)).toEqual([
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
    ]);
    expect(controlOptions(field('radio'), options)).toBe(options);
  });

  it('places describedby and the test id by kind and drops undefined props', () => {
    const text = field('text', { helperText: 'Help' });
    const state = { ...fieldState({ id: 'f-text', field: text, error: 'Bad' }), value: 'x', testId: 'name' };
    const input = controlProps(text, state, {
      kind: 'input',
      shell: true,
      input: true,
      attrs: { id: 'f-text', value: 'old', placeholder: undefined },
      valueKey: 'value',
    });
    expect(input.control).toEqual({
      id: 'f-text',
      value: 'x',
      'aria-describedby': 'f-text-helper f-text-error',
      'data-testid': 'name',
      type: 'text',
    });
    expect(input.root).toEqual({ 'data-fh': 'field' });
    const radio = field('radio');
    const group = controlProps(
      radio,
      { ...fieldState({ id: 'f-radio', field: radio, error: 'Bad' }), value: 'a', testId: 'plan' },
      {
        kind: 'group',
        shell: true,
        input: false,
        attrs: { modelValue: 'old', placeholder: 'Pick', inputMode: 'numeric', autocomplete: 'off', 'onUpdate:modelValue': () => {} },
        valueKey: 'modelValue',
      },
    );
    expect(group).toEqual({
      control: { modelValue: 'a' },
      root: { 'data-fh': 'field', 'data-testid': 'plan', 'aria-invalid': true, 'aria-describedby': 'f-radio-error' },
    });
    const bare = controlProps(
      radio,
      { ...fieldState({ id: 'f-radio', field: radio, error: 'Bad' }), value: 'a' },
      {
        kind: 'group',
        shell: false,
        input: false,
        attrs: { 'aria-invalid': true },
        valueKey: 'value',
      },
    );
    expect(bare).toEqual({ control: { 'aria-invalid': true, value: 'a' }, root: { 'data-fh': 'field' } });
  });
});
