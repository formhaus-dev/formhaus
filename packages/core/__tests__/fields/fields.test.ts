import { describe, expect, it } from 'vitest';
import type { FormField } from '../../src';
import {
  fieldState,
  fieldValue,
  fromDate,
  inputType,
  numberValue,
  optionChecked,
  optionText,
  optionValue,
  scaleView,
  toDate,
  toggleOption,
} from '../../src/fields';
import { validateFieldValue } from '../../src';

const field = (overrides: Partial<FormField> = {}): FormField => ({ key: 'name', type: 'text', label: 'Name', ...overrides });

describe('fieldState', () => {
  it('gives the ids, aria and flags of a field', () => {
    expect(
      fieldState({ id: 'f-name', field: field({ helperText: 'Help', validation: { required: true } }), error: 'Bad', loading: true }),
    ).toEqual({
      id: 'f-name',
      name: 'name',
      label: 'Name',
      helperText: 'Help',
      placeholder: undefined,
      inputMode: undefined,
      inputType: 'text',
      error: 'Bad',
      helperId: 'f-name-helper',
      errorId: 'f-name-error',
      describedBy: 'f-name-helper f-name-error',
      invalid: true,
      required: true,
      disabled: true,
      optionId: expect.any(Function),
      aria: { 'aria-invalid': true, 'aria-required': true, 'aria-describedby': 'f-name-helper f-name-error' },
    });
  });

  it('falls back to the default id and leaves out aria that does not apply', () => {
    const state = fieldState({ field: field() });
    expect([state.id, state.describedBy, state.invalid, state.disabled]).toEqual(['fh-name', undefined, false, false]);
    expect(state.aria).toEqual({ 'aria-invalid': undefined, 'aria-required': undefined, 'aria-describedby': undefined });
    expect([state.optionId(0), state.optionId(2)]).toEqual(['fh-name', 'fh-name-2']);
  });
});

describe('length limits', () => {
  it('gives minLength and maxLength of text fields for character counters', () => {
    const limits = (type: string) => {
      const state = fieldState({ field: field({ type, validation: { minLength: 2, maxLength: 200 } }) });
      return [state.minLength, state.maxLength];
    };
    expect(['text', 'email', 'phone', 'password', 'textarea'].map(limits)).toEqual(Array(5).fill([2, 200]));
    expect(['multiselect', 'number', 'select'].map(limits)).toEqual(Array(3).fill([undefined, undefined]));
    expect([fieldState({ field: field() }).maxLength]).toEqual([undefined]);
  });
});

describe('inputs', () => {
  it('maps field types to input types and reads the placeholder, mask and input mode', () => {
    expect(
      ['text', 'email', 'phone', 'number', 'password', 'date', 'time', 'datetime', 'x-custom', 'constructor', '__proto__'].map((type) =>
        inputType({ type }),
      ),
    ).toEqual(['text', 'email', 'tel', 'number', 'password', 'date', 'time', 'datetime-local', 'text', 'text', 'text']);
    const state = fieldState({ field: field({ mask: '(___) ___', inputMode: 'tel' }) });
    expect([state.placeholder, state.inputMode]).toEqual(['(___) ___', 'tel']);
  });

  it('checks an option against a single or a list value', () => {
    const option = { value: '1', label: 'One' };
    expect([optionChecked('1', option), optionChecked(1, option), optionChecked(['1'], option), optionChecked(null, option)]).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });
});

describe('scaleView', () => {
  const scale = (overrides: Partial<FormField>) => field({ type: 'scale', ...overrides });

  it('lists the points from validation and starts a rating at 1', () => {
    expect(scaleView(scale({})).points).toEqual([1, 2, 3, 4, 5]);
    expect(scaleView(scale({ validation: { min: 0, max: 10 } })).points).toHaveLength(11);
    expect(scaleView(scale({ type: 'rating', validation: { min: 3, max: 4 } })).points).toEqual([1, 2, 3, 4]);
    expect(scaleView(scale({ validation: { min: 0, max: 20 } })).points).toHaveLength(11);
  });

  it('gives an empty view for an inverted range', () => {
    expect(scaleView(scale({ validation: { min: 5, max: 1 }, options: [{ value: '3', label: 'Mid' }] }))).toEqual({
      points: [],
      min: 5,
      max: 1,
      anchors: [undefined, undefined, undefined],
    });
  });

  it('reads the start, middle and end labels from options with string values', () => {
    const options = [
      { value: '0', label: 'Never' },
      { value: '5', label: 'Maybe' },
      { value: '10', label: 'Always' },
    ];
    expect(scaleView(scale({ validation: { min: 0, max: 10 }, options })).anchors).toEqual([
      { point: 0, label: 'Never' },
      { point: 5, label: 'Maybe' },
      { point: 10, label: 'Always' },
    ]);
    expect(scaleView(scale({ validation: { min: 1, max: 2 }, options: [{ value: '1', label: 'Low' }] })).anchors).toEqual([
      { point: 1, label: 'Low' },
      undefined,
      undefined,
    ]);
  });
});

describe('date values', () => {
  const date = new Date(2026, 0, 5, 9, 7);

  it('writes the values core accepts for each type', () => {
    for (const type of ['date', 'datetime', 'time'] as const) expect(validateFieldValue(field({ type }), fromDate(date, type))).toBeNull();
    expect([fromDate(date), fromDate(date, 'datetime'), fromDate(date, 'time')]).toEqual(['2026-01-05', '2026-01-05T09:07', '09:07']);
  });

  it('reads every value core accepts, in local time without a zone', () => {
    expect(toDate('2026-01-05')).toEqual(new Date(2026, 0, 5));
    expect(toDate('2026-01-05T09:07')).toEqual(date);
    expect(toDate('2026-01-05T09:07:30')).toEqual(new Date(2026, 0, 5, 9, 7, 30));
    expect(toDate('2026-01-05T09:07:30.5')).toEqual(new Date(2026, 0, 5, 9, 7, 30, 500));
    expect(toDate('2026-01-05T09:07Z')).toEqual(new Date(Date.UTC(2026, 0, 5, 9, 7)));
    expect(toDate('2026-01-05T09:07+02:00')).toEqual(new Date(Date.UTC(2026, 0, 5, 7, 7)));
    expect(toDate('2026-01-05T09:07:30.123-05:30')).toEqual(new Date(Date.UTC(2026, 0, 5, 14, 37, 30, 123)));
    expect(toDate('09:07')).toEqual(new Date(1970, 0, 1, 9, 7));
    expect(toDate('09:07:30')).toEqual(new Date(1970, 0, 1, 9, 7, 30));
  });

  it('keeps an empty, broken or impossible value empty', () => {
    expect([fromDate(null), fromDate(new Date(Number.NaN)), toDate(''), toDate(null), toDate('5 Jan')]).toEqual(Array(5).fill(null));
    expect(['2026-02-31', '2026-13-01', '2026-01-05T24:00', '25:00', '09:60', '2026-01-05T09:07+2'].map(toDate)).toEqual(
      Array(6).fill(null),
    );
  });
});

describe('options', () => {
  const options = [
    { value: 'us', label: 'United States' },
    { value: 'a', label: 'Same' },
    { value: 'b', label: 'Same' },
  ];

  it('shows the label of a stored value and stores the value of a typed label', () => {
    expect([optionText(options, 'us'), optionValue(options, 'United States')]).toEqual(['United States', 'us']);
    expect([optionText(options, 'b'), optionValue(options, 'Same (b)')]).toEqual(['Same (b)', 'b']);
  });

  it('keeps text that matches no option', () => {
    expect([optionText(options, 'Narnia'), optionText(options, undefined), optionValue(options, 'Narnia')]).toEqual([
      'Narnia',
      '',
      'Narnia',
    ]);
  });

  it('toggles an option in a multiselect value', () => {
    expect(toggleOption(undefined, 'a')).toEqual(['a']);
    expect(toggleOption(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleOption(['b'], 'a')).toEqual(['b', 'a']);
  });
});

describe('numberValue', () => {
  it('turns text into the number value core accepts', () => {
    expect([numberValue('42'), numberValue(' 1.5 '), numberValue('-2e3'), numberValue(''), numberValue(null), numberValue('abc')]).toEqual([
      42,
      1.5,
      -2000,
      null,
      null,
      'abc',
    ]);
    expect(['0x10', '0b1', '0o7', 'Infinity', '1_000'].map(numberValue)).toEqual(['0x10', '0b1', '0o7', 'Infinity', '1_000']);
    expect([fieldValue({ type: 'number' }, '7'), fieldValue({ type: 'text' }, '7'), fieldValue({ type: 'number' }, 7)]).toEqual([
      7,
      '7',
      7,
    ]);
  });
});
