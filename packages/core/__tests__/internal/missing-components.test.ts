import { afterEach, describe, expect, it, vi } from 'vitest';
import { warnMissingComponents } from '../../src/internal';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  id: 'invoice',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'client', type: 'text', label: 'Client' },
    { key: 'rating', type: 'x-rating', label: 'Rating' },
    { key: 'lines', type: 'group', label: 'Lines', fields: [{ key: 'amount', type: 'x-money', label: 'Amount' }] },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('warnMissingComponents', () => {
  it('warns once per type without a component and lists the registered types', () => {
    const onWarning = vi.fn();
    const warned = new Set<string>();
    const components = { text: {}, group: {}, section: undefined };
    warnMissingComponents(definition, components, warned, onWarning);
    warnMissingComponents(definition, components, warned, onWarning);
    expect(onWarning.mock.calls.map(([issue]) => [issue.code, issue.severity, issue.message])).toEqual([
      [
        'missing-component',
        'warning',
        'No component is registered for the field type "x-rating", so it renders a placeholder. Registered types: text. Add a component for "x-rating" to components.',
      ],
      [
        'missing-component',
        'warning',
        'No component is registered for the field type "x-money", so it renders a placeholder. Registered types: text. Add a component for "x-money" to components.',
      ],
    ]);
  });

  it('falls back to console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnMissingComponents(definition, { text: {}, 'x-rating': {}, 'x-money': {} }, new Set(), undefined);
    expect(warn).not.toHaveBeenCalled();
    warnMissingComponents(definition, undefined, new Set(['x-rating', 'x-money']), undefined);
    expect(warn.mock.calls).toEqual([
      [
        '[formhaus] No component is registered for the field type "text", so it renders a placeholder. Registered types: none. Add a component for "text" to components.',
      ],
    ]);
  });
});
