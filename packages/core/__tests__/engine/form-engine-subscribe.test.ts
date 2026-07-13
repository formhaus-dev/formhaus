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

  it('notifies only the field whose value changed', () => {
    const engine = new FormEngine(definition);
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const snapshotA = engine.getFieldSnapshot('a');
    const snapshotB = engine.getFieldSnapshot('b');
    engine.subscribeField('a', listenerA);
    engine.subscribeField('b', listenerB);

    engine.setValue('a', '1');

    expect(listenerA).toHaveBeenCalledOnce();
    expect(listenerB).not.toHaveBeenCalled();
    expect(engine.getFieldSnapshot('a')).toBe(snapshotA + 1);
    expect(engine.getFieldSnapshot('b')).toBe(snapshotB);
  });

  it('notifies fields cleared by a visibility cascade', () => {
    const conditionalDefinition: FormDefinition = {
      id: 'conditional-subscribe',
      title: 'Conditional subscribe',
      submit: { label: 'Submit' },
      fields: [
        { key: 'country', type: 'text', label: 'Country' },
        {
          key: 'region',
          type: 'text',
          label: 'Region',
          show: [{ field: 'country', eq: 'US' }],
        },
      ],
    };
    const engine = new FormEngine(conditionalDefinition, { country: 'US', region: 'CA' });
    const countryListener = vi.fn();
    const regionListener = vi.fn();
    engine.subscribeField('country', countryListener);
    engine.subscribeField('region', regionListener);

    engine.setValue('country', 'JP');

    expect(countryListener).toHaveBeenCalledOnce();
    expect(regionListener).toHaveBeenCalledOnce();
  });

  it('notifies fields whose external errors changed', () => {
    const engine = new FormEngine(definition);
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    engine.subscribeField('a', listenerA);
    engine.subscribeField('b', listenerB);

    engine.setErrors({ a: 'First error' });
    engine.setErrors({ b: 'Second error' });

    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledOnce();
  });

  it('notifies fields after validate and validateField change errors', () => {
    const requiredDefinition: FormDefinition = {
      ...definition,
      fields: [
        { key: 'a', type: 'text', label: 'A', validation: { required: true } },
        { key: 'b', type: 'text', label: 'B', validation: { required: true } },
      ],
    };
    const engine = new FormEngine(requiredDefinition);
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    engine.subscribeField('a', listenerA);
    engine.subscribeField('b', listenerB);

    engine.validateField('a');
    expect(listenerA).toHaveBeenCalledOnce();
    expect(listenerB).not.toHaveBeenCalled();

    engine.validate();
    expect(listenerA).toHaveBeenCalledOnce();
    expect(listenerB).toHaveBeenCalledOnce();
  });

  it('notifies fields whose loading or reset state changed', () => {
    const engine = new FormEngine(definition, { a: 'initial' });
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    engine.subscribeField('a', listenerA);
    engine.subscribeField('b', listenerB);

    engine.setFieldLoading('a', true);
    engine.reset();

    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).not.toHaveBeenCalled();
  });

});
