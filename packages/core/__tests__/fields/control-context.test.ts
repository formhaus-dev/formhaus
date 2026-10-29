import { describe, expect, it, vi } from 'vitest';
import type { FormField } from '../../src';
import { type ControlContext, controlProps } from '../../src/controls';
import { fieldState, freeText } from '../../src/fields';
import { controlEntry } from '../../src/internal';

const options = [
  { value: 'de', label: 'Germany' },
  { value: 'nl', label: 'Netherlands' },
];

describe('controlEntry context', () => {
  const Control = () => null;
  const context: ControlContext = {
    kind: 'group',
    field: { key: 'size', type: 'radio', label: 'Size', layout: 'inline' },
    anchors: [{ point: 1, label: 'Sad' }, undefined, undefined],
  };
  const adapt = (_f: unknown, _list: unknown[], { kind, field, anchors }: ControlContext) => ({
    kind,
    layout: field.layout,
    anchor: anchors[0]?.label,
  });
  const expected = { kind: 'group', layout: 'inline', anchor: 'Sad' };

  it('passes the context to tuple and object props', () => {
    expect(controlEntry([Control, adapt], 'onChange').props({}, options, context)).toEqual(expected);
    expect(controlEntry({ component: Control, props: adapt }, 'onChange').props({}, options, context)).toEqual(expected);
  });

  it('keeps two-argument props and an options prop working beside the context', () => {
    const plain = (_f: unknown, list: unknown[]) => ({ count: list.length });
    expect(controlEntry([Control, plain], 'onChange').props({}, options, context)).toEqual({ count: 2 });
    expect(controlEntry({ component: Control, optionsProp: 'items', props: adapt }, 'onChange').props({}, options, context)).toEqual({
      items: options,
      ...expected,
    });
  });
});

describe('freeText', () => {
  it('shows the label of the value, or the value when no option has it', () => {
    expect(freeText(options, 'de', '', vi.fn()).text).toBe('Germany');
    expect(freeText(options, 'Paris', '', vi.fn()).text).toBe('Paris');
    expect(freeText(options, null, 'Berl', vi.fn()).text).toBe('');
    expect(freeText([], 'de', '', vi.fn()).text).toBe('de');
  });

  it('keeps typed text that still gives the value', () => {
    expect(freeText(options, 'nl', 'nl', vi.fn()).text).toBe('nl');
    expect(freeText(options, 'Berl', 'Berl', vi.fn()).text).toBe('Berl');
    expect(freeText(options, 'de', 'nl', vi.fn()).text).toBe('Germany');
  });

  it('saves the option value of a label and other text as typed', () => {
    const save = vi.fn();
    const { setText } = freeText(options, null, '', save);
    setText('Netherlands');
    setText('Paris');
    setText('');
    expect(save.mock.calls).toEqual([
      ['nl', 'Netherlands'],
      ['Paris', 'Paris'],
      ['', ''],
    ]);
  });

  it('shows options of the same label with their value and saves the picked one', () => {
    const twins = [
      { value: 'ny', label: 'Paris' },
      { value: 'fr', label: 'Paris' },
    ];
    const save = vi.fn();
    expect(freeText(twins, 'fr', '', save).text).toBe('Paris (fr)');
    freeText(twins, null, '', save).setText('Paris (fr)');
    expect(save).toHaveBeenCalledWith('fr', 'Paris (fr)');
  });
});

describe('controlProps free text', () => {
  const city: FormField = { key: 'city', type: 'autocomplete', label: 'City', options };
  const preset = { kind: 'input' as const, shell: false, input: false, attrs: {}, valueKey: 'value' };
  const props = (value: unknown, text?: string) =>
    controlProps(city, { ...fieldState({ id: 'f', field: city }), value, options }, { ...preset, text, setText: vi.fn() });

  it('reports free text only for an autocomplete with text', () => {
    expect([props('de', '').freeText, props('de').freeText]).toEqual([true, false]);
    const select = { ...city, type: 'select' };
    expect(controlProps(select, { ...fieldState({ id: 'f', field: select }), value: '', options }, { ...preset, text: '' }).freeText).toBe(
      false,
    );
  });

  it('shows the same text as the field view', () => {
    for (const [value, text] of [
      ['de', ''],
      ['nl', 'nl'],
      ['Berl', 'Berl'],
      [null, 'Berl'],
    ] as const)
      expect(props(value, text).control.value).toBe(freeText(options, value, text, vi.fn()).text);
  });

  it('uses a field view free text as it is', () => {
    const setText = vi.fn();
    const typed = { text: 'Berl', setText };
    const mapped = controlProps(city, { ...fieldState({ id: 'f', field: city }), value: 'Berl', options }, { ...preset, freeText: typed });
    expect([mapped.control.value, mapped.freeText, mapped.save('Netherlands')]).toEqual(['Berl', true, 'nl']);
    expect(setText).toHaveBeenCalledWith('Netherlands');
  });
});
