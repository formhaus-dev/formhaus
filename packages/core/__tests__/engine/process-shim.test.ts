import { afterEach, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';

afterEach(() => vi.unstubAllGlobals());

it('creates an engine when a process shim has no env', () => {
  vi.stubGlobal('process', {});
  const engine = new FormEngine({
    id: 'shim',
    title: '',
    submit: { label: 'Send' },
    fields: [{ key: 'name', type: 'text', label: 'Name' }],
  });
  expect(engine.values).toEqual({});
});
