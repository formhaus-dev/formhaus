import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  id: 'sub-test',
  title: 'Subscribe Test',
  submit: { label: 'Submit' },
  fields: [
    { key: 'a', type: 'text', label: 'A' },
    { key: 'b', type: 'text', label: 'B' },
  ],
};

describe('FormEngine - Subscribe/getSnapshot', () => {
  it('getSnapshot returns 0 initially', () => {
    const engine = new FormEngine(definition);
    expect(engine.getSnapshot()).toBe(0);
  });

  it('version increments on setValue', () => {
    const engine = new FormEngine(definition);
    engine.setValue('a', '1');
    expect(engine.getSnapshot()).toBe(1);
    engine.setValue('b', '2');
    expect(engine.getSnapshot()).toBe(2);
  });

  it('version increments on setErrors', () => {
    const engine = new FormEngine(definition);
    engine.setErrors({ a: 'err' });
    expect(engine.getSnapshot()).toBe(1);
  });

  it('version increments on validate', () => {
    const engine = new FormEngine(definition);
    engine.validate();
    expect(engine.getSnapshot()).toBe(1);
  });

  it('version increments on validateField', () => {
    const engine = new FormEngine(definition);
    engine.validateField('a');
    expect(engine.getSnapshot()).toBe(1);
  });

  it('version increments on reset', () => {
    const engine = new FormEngine(definition);
    engine.reset();
    expect(engine.getSnapshot()).toBe(1);
  });

  it('version increments on setFieldLoading', () => {
    const engine = new FormEngine(definition);
    engine.setFieldLoading('a', true);
    expect(engine.getSnapshot()).toBe(1);
  });

  it('subscribe callback called on each mutation', () => {
    const engine = new FormEngine(definition);
    const cb = vi.fn();
    engine.subscribe(cb);

    engine.setValue('a', '1');
    engine.setValue('b', '2');
    engine.validate();

    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('unsubscribe prevents future calls', () => {
    const engine = new FormEngine(definition);
    const cb = vi.fn();
    const unsub = engine.subscribe(cb);

    engine.setValue('a', '1');
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    engine.setValue('b', '2');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
