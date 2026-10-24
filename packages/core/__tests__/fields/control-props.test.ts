import { describe, expect, it, vi } from 'vitest';
import type { FormField } from '../../src';
import { controlProps } from '../../src/controls';
import { fieldState } from '../../src/fields';

const field = (type: string, overrides: Partial<FormField> = {}): FormField => ({ key: type, type, label: type, ...overrides });

describe('controlProps field props', () => {
  const preset = { kind: 'input' as const, shell: false, input: false, attrs: {}, valueKey: 'value' };
  const props = (
    control: FormField,
    value: unknown,
    extra: Partial<typeof preset> & { text?: string; setText?: (text: string) => void } = {},
  ) => controlProps(control, { ...fieldState({ id: 'f', field: control }), value, options: control.options }, { ...preset, ...extra });

  it('passes rows to a textarea and accept to a file control only', () => {
    expect(props(field('textarea', { rows: 6 }), 'x').control).toEqual({ value: 'x', rows: 6 });
    expect(props(field('file', { accept: '.pdf' }), null).control).toEqual({ accept: '.pdf' });
    expect(props(field('text', { rows: 6, accept: '.pdf' }), 'x').control).toEqual({ value: 'x' });
    expect(props(field('textarea'), '').control).toEqual({ value: '' });
  });

  it('gives the anchors of a scale and none for other types', () => {
    const scale = field('scale', {
      validation: { min: 1, max: 5 },
      options: [
        { value: '1', label: 'Bad' },
        { value: '5', label: 'Great' },
      ],
    });
    expect(props(scale, 3).anchors).toEqual([{ point: 1, label: 'Bad' }, undefined, { point: 5, label: 'Great' }]);
    expect(props(field('radio'), 'a').anchors).toEqual([]);
  });

  it('saves what the control sends', () => {
    expect(props(field('text'), '').save({ target: { value: 'Ada' }, preventDefault() {} })).toBe('Ada');
    expect(props(field('radio'), '').save({ target: { value: 'x' }, preventDefault() {} }, 'b')).toBe('b');
  });

  it('round-trips typed text for an autocomplete', () => {
    const city = field('autocomplete', {
      options: [
        { value: 'de', label: 'Germany' },
        { value: 'nl', label: 'Netherlands' },
      ],
    });
    const keep = vi.fn();
    expect(props(city, 'de', { text: '' }).control.value).toBe('Germany');
    expect(props(city, 'de', { text: 'Germany' }).control.value).toBe('Germany');
    expect(props(city, 'Berl', { text: 'Berl' }).control.value).toBe('Berl');
    expect(props(city, null, { text: 'Berl' }).control.value).toBe('');
    expect(props(city, 'de').control.value).toBe('de');
    expect(props(city, '', { text: '', setText: keep }).save('Netherlands')).toBe('nl');
    expect(props(city, '', { text: '', setText: keep }).save({ target: { value: 'Paris' }, preventDefault() {} })).toBe('Paris');
    expect(props(city, '', { text: '', setText: keep }).save(null)).toBe('');
    expect(keep.mock.calls).toEqual([['Netherlands'], ['Paris'], ['']]);
    expect(props(city, '').save('Netherlands')).toBe('Netherlands');
    expect(props(field('select', { options: city.options }), '', { text: '', setText: keep }).save('Netherlands')).toBe('Netherlands');
    expect(keep).toHaveBeenCalledTimes(3);
    const twins = field('autocomplete', {
      options: [
        { value: 'a', label: 'Same' },
        { value: 'b', label: 'Same' },
      ],
    });
    expect([props(twins, 'b', { text: '' }).control.value, props(twins, '', { text: '', setText: keep }).save('Same')]).toEqual([
      'Same',
      'a',
    ]);
  });
});
