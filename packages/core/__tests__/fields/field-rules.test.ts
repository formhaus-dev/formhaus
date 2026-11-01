import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition, FormField } from '../../src';
import { choiceControl } from '../../src/controls';
import { fieldAria, fieldState, optionAttrs, optionDescriptionId, optionLocked, readOnlyAttrs } from '../../src/fields';
import { keepReadOnly, movedFocusId, moveButtonId, warnMissingComponents } from '../../src/internal';

const field = (type: string): FormField => ({ key: type, type, label: type });

describe('read-only attributes', () => {
  it('uses the readonly attribute where HTML supports it and aria-readonly elsewhere', () => {
    expect(
      ['text', 'textarea', 'number', 'date', 'time', 'datetime', 'autocomplete'].map((type) =>
        readOnlyAttrs({ field: field(type), readOnly: true }),
      ),
    ).toEqual(Array(7).fill({ readOnly: true }));
    expect(['checkbox', 'select', 'multiselect', 'switch'].map((type) => readOnlyAttrs({ field: field(type), readOnly: true }))).toEqual(
      Array(4).fill({ 'aria-readonly': true }),
    );
    expect(readOnlyAttrs({ field: field('file'), readOnly: true })).toEqual({});
    expect(readOnlyAttrs({ field: field('radio') })).toEqual({});
  });

  it('puts aria-readonly of radios on the radio group', () => {
    const radios = ['radio', 'scale', 'rating'].map((type) => field(type));
    expect(radios.map((item) => readOnlyAttrs({ field: item, readOnly: true }))).toEqual([{}, {}, {}]);
    expect(radios.map((item) => readOnlyAttrs({ field: item, readOnly: true }, true))).toEqual(
      Array(3).fill({ role: 'radiogroup', 'aria-readonly': true }),
    );
    expect(readOnlyAttrs({ field: field('multiselect'), readOnly: true }, true)).toEqual({});
  });

  it('puts aria-readonly in the field aria and state', () => {
    expect(fieldAria({ field: field('select'), readOnly: true })['aria-readonly']).toBe(true);
    expect(fieldAria({ field: field('text'), readOnly: true })['aria-readonly']).toBeUndefined();
    expect(fieldState({ field: field('text'), readOnly: true })).toMatchObject({ readOnly: true, disabled: false });
  });

  it('blocks clicks, Space and arrow keys but not Tab', () => {
    const event = (key?: string) => ({ key, preventDefault: vi.fn() });
    const blocked = [undefined, ' ', 'ArrowDown', 'Tab', 'Enter'].map((key) => {
      const pressed = event(key);
      keepReadOnly(pressed);
      return pressed.preventDefault.mock.calls.length;
    });
    expect(blocked).toEqual([1, 1, 1, 0, 0]);
  });
});

describe('option attributes', () => {
  it('disables an option and points at its description', () => {
    expect(optionAttrs({ value: 'a', label: 'A', description: 'More', disabled: true }, 'fh-plan-1')).toEqual({
      disabled: true,
      'aria-describedby': 'fh-plan-1-description',
    });
    expect(optionAttrs({ value: 'a', label: 'A' }, 'fh-plan-1', true)).toEqual({ disabled: true, 'aria-describedby': undefined });
    expect(optionDescriptionId('x')).toBe('x-description');
  });

  it('locks every unselected select option of a read-only field', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    expect(options.map((option) => optionLocked(option, 'a', true))).toEqual([false, true, true]);
    expect(options.map((option) => optionLocked(option, 'a'))).toEqual([false, true, false]);
  });

  it('does not pick a disabled option in choiceControl', () => {
    const change = vi.fn();
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    const choice = choiceControl(() => ({ field: field('radio'), value: null, options, disabled: false }), change, vi.fn());
    choice.pick('b');
    choice.pick('a');
    expect(change.mock.calls).toEqual([['a']]);
  });
});

describe('reorder helpers', () => {
  it('focuses the button of the moved item that stays enabled', () => {
    expect(moveButtonId('t', true)).toBe('t-up');
    expect([movedFocusId('t', 2, 1, 3), movedFocusId('t', 1, 0, 3), movedFocusId('t', 0, 1, 3), movedFocusId('t', 1, 2, 3)]).toEqual([
      't-up',
      't-down',
      't-down',
      't-up',
    ]);
  });

  it('warns once when a reorderable group has no group item component', () => {
    const definition = (formatVersion: string): FormDefinition => ({
      formatVersion,
      id: 'crew',
      title: '',
      submit: { label: 'Send' },
      fields: [
        { key: 'people', type: 'group', label: 'People', reorderable: true, fields: [{ key: 'name', type: 'text', label: 'Name' }] },
      ],
    });
    const onWarning = vi.fn();
    const components = { text: {} };
    warnMissingComponents(definition('1.7'), { components }, new Set(), onWarning);
    warnMissingComponents(definition('1.8'), { components, layout: { groupItem: {} } }, new Set(), onWarning);
    expect(onWarning).not.toHaveBeenCalled();
    const warned = new Set<string>();
    warnMissingComponents(definition('1.8'), { components }, warned, onWarning);
    warnMissingComponents(definition('1.8'), { components }, warned, onWarning);
    expect(onWarning.mock.calls.map(([issue]) => issue.code)).toEqual(['missing-component']);
  });
});
