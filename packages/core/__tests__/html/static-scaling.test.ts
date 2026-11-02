import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from '../../src/html';
import type { StaticMarkupOptions } from '../../src/html';
import { form } from './fixtures';

const SCANNERS = ['indexOf', 'includes', 'find', 'findIndex', 'some', 'every'] as const;

function scanned(run: () => void): number {
  let total = 0;
  for (const name of SCANNERS) {
    const original = Array.prototype[name] as (...args: unknown[]) => unknown;
    vi.spyOn(Array.prototype, name).mockImplementation(function (this: unknown[], ...args: unknown[]) {
      total += this.length;
      return original.apply(this, args);
    } as never);
  }
  try {
    run();
  } finally {
    vi.restoreAllMocks();
  }
  return total;
}

function scans(type: string, size: number, defaulted: boolean, options: StaticMarkupOptions): number {
  const values = Array.from({ length: size }, (_, index) => `v${index}`);
  const field = {
    key: 'k',
    type,
    label: 'K',
    options: values.map((value, index) => ({ value, label: `Option ${index}` })),
    ...(defaulted && { defaultValue: values }),
  };
  const definition = form([field as never]);
  return scanned(() => renderToStaticMarkup(definition, { ...options, values: options.values && { k: values } }));
}

const SMALL = 200;
const LARGE = 800;

describe('option rendering scales linearly', () => {
  afterEach(() => vi.restoreAllMocks());

  const cases: [string, string, boolean, StaticMarkupOptions][] = [
    ['radio', 'radio', false, {}],
    ['read-only radio with nothing selected', 'radio', false, { readOnly: true }],
    ['select', 'select', false, {}],
    ['autocomplete', 'autocomplete', false, {}],
    ['multiselect', 'multiselect', false, {}],
    ['multiselect with every option selected', 'multiselect', false, { values: {} }],
    ['read-only multiselect with every option selected', 'multiselect', false, { values: {}, readOnly: true }],
    ['multiselect with every option as its default', 'multiselect', true, {}],
  ];

  it.each(cases)('%s', (_name, type, defaulted, options) => {
    const small = scans(type, SMALL, defaulted, options);
    const large = scans(type, LARGE, defaulted, options);
    expect(large).toBeLessThan(small * (LARGE / SMALL) * 1.5);
  });
});
