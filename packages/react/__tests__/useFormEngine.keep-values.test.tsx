import { act, render, renderHook, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FormRenderer, useFormEngine } from '../src';

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

  it('keeps a dispatched submit in flight across a replacement', async () => {
    const { result, rerender } = renderHook(({ definition }) => useFormEngine(definition, { name: 'Ada' }, { keepValues: true }), {
      initialProps: { definition: first },
    });
    const engine = result.current;
    let release!: () => void;
    const submitting = engine.submit(() => new Promise<void>((resolve) => (release = resolve)));
    await Promise.resolve();
    rerender({ definition: second });
    expect(engine.submitting).toBe(true);
    expect(await engine.submit(() => {})).toBe(false);
    release();
    expect(await submitting).toBe(true);
    expect(engine.submitting).toBe(false);
  });

  it('creates a new engine without keepValues', () => {
    const { result, rerender } = renderHook(({ definition }) => useFormEngine(definition), { initialProps: { definition: first } });
    const engine = result.current;
    act(() => engine.setValue('name', 'Ada'));
    rerender({ definition: second });
    expect(result.current).not.toBe(engine);
    expect(result.current.values).toEqual({ city: 'Oslo' });
  });

  it('settles when the definition is built from the values on every render', async () => {
    function Signup() {
      const [values, setValues] = useState<Readonly<Record<string, unknown>>>({});
      const definition: FormDefinition = values.name ? { ...second } : first;
      return (
        <FormRenderer definition={definition} keepValues initialValues={{ name: 'Ada' }} onValuesChange={setValues} onSubmit={() => {}} />
      );
    }
    render(<Signup />);
    expect(((await screen.findByLabelText(/City/)) as HTMLInputElement).value).toBe('Oslo');
    expect((screen.getByLabelText(/Full name/) as HTMLInputElement).value).toBe('Ada');
  });
});
