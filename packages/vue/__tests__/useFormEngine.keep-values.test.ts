import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, shallowRef } from 'vue';
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
  it('replaces the definition on the same engine', async () => {
    const definition = shallowRef(first);
    const scope = effectScope();
    const form = scope.run(() => useFormEngine(() => definition.value, undefined, { keepValues: true }))!;
    const engine = form.engine;
    engine.setValue('name', 'Ada');
    definition.value = second;
    await nextTick();
    expect(form.engine).toBe(engine);
    expect(engine.definition).toBe(second);
    expect(form.values.value).toEqual({ name: 'Ada', city: 'Oslo' });
    scope.stop();
  });

  it('keeps a dispatched submit in flight across a replacement', async () => {
    const definition = shallowRef(first);
    const scope = effectScope();
    const form = scope.run(() => useFormEngine(() => definition.value, { name: 'Ada' }, { keepValues: true }))!;
    let release!: () => void;
    const submitting = form.engine.submit(() => new Promise<void>((resolve) => (release = resolve)));
    await Promise.resolve();
    definition.value = second;
    await nextTick();
    expect(form.engine.submitting).toBe(true);
    expect(await form.engine.submit(() => {})).toBe(false);
    release();
    expect(await submitting).toBe(true);
    expect(form.engine.submitting).toBe(false);
    scope.stop();
  });

  it('creates a new engine without keepValues', async () => {
    const definition = shallowRef(first);
    const scope = effectScope();
    const form = scope.run(() => useFormEngine(() => definition.value))!;
    const engine = form.engine;
    engine.setValue('name', 'Ada');
    definition.value = second;
    await nextTick();
    expect(form.engine).not.toBe(engine);
    expect(form.values.value).toEqual({ city: 'Oslo' });
    scope.stop();
  });
});
