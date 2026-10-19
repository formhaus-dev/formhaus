import { act, renderHook } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { useFormEngine } from '../src';

const first: FormDefinition = { id: 'one', title: '', submit: { label: 'Send' }, fields: [{ key: 'name', type: 'text', label: 'Name' }] };
const second: FormDefinition = {
  ...first,
  fields: [
    { key: 'name', type: 'text', label: 'Full name' },
    { key: 'city', type: 'text', label: 'City', defaultValue: 'Oslo' },
  ],
};

describe('useFormEngine keepValues', () => {
  it('replaces the definition on the same engine', () => {
    const { result, rerender } = renderHook(({ definition }) => useFormEngine(definition, undefined, { keepValues: true }), {
      initialProps: { definition: first },
    });
    const engine = result.current;
    act(() => engine.setValue('name', 'Ada'));
    rerender({ definition: second });
    expect(result.current).toBe(engine);
    expect(engine.definition).toBe(second);
    expect(engine.values).toEqual({ name: 'Ada', city: 'Oslo' });
  });

  it('creates a new engine without keepValues', () => {
    const { result, rerender } = renderHook(({ definition }) => useFormEngine(definition), { initialProps: { definition: first } });
    const engine = result.current;
    act(() => engine.setValue('name', 'Ada'));
    rerender({ definition: second });
    expect(result.current).not.toBe(engine);
    expect(result.current.values).toEqual({ city: 'Oslo' });
  });
});
