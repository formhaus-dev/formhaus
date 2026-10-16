import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { onExtras } from './form-engine-skip.fixtures';

const definition: FormDefinition = {
  id: 'values',
  title: 'Values',
  submit: { label: 'Submit' },
  fields: [
    { key: 'country', type: 'text', label: 'Country' },
    { key: 'region', type: 'text', label: 'Region', show: [{ field: 'country', eq: 'US' }] },
    {
      key: 'lines',
      type: 'group',
      label: 'Lines',
      fields: [{ key: 'qty', type: 'number', label: 'Qty' }],
    },
  ],
};

function watch(engine: FormEngine) {
  const listener = vi.fn();
  engine.subscribeValues(listener);
  return listener;
}

describe('FormEngine value subscriptions', () => {
  it('notifies once per value-changing operation', () => {
    const engine = new FormEngine(definition, { country: 'US' });
    const listener = watch(engine);
    engine.setValue('region', 'CA');
    expect(listener).toHaveBeenCalledTimes(1);
    engine.setValue('country', 'JP');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(engine.getValuesSnapshot()).not.toHaveProperty('region');
    engine.setValue('country', 'US');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(engine.getValuesSnapshot().region).toBe('CA');
  });

  it('notifies for group item add, edit and remove', () => {
    const engine = new FormEngine(definition);
    const listener = watch(engine);
    engine.addItem('lines');
    engine.setItemValue('lines', 0, 'qty', 2);
    engine.setValue('lines[0].qty', 3);
    engine.removeItem('lines', 0);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('notifies on reset only when values differ', () => {
    const engine = new FormEngine(definition, { country: 'US' });
    const listener = watch(engine);
    engine.reset({ country: 'US' });
    expect(listener).not.toHaveBeenCalled();
    engine.reset({ country: 'JP' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('notifies on skip and on skip rollback', async () => {
    const engine = await onExtras();
    engine.setValue('phone', '555');
    await engine.next();
    const listener = watch(engine);
    await engine.skip(vi.fn().mockRejectedValue(new Error('offline'))).catch(() => undefined);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('ignores equal values, errors, loading and navigation', async () => {
    const engine = await onExtras();
    const listener = watch(engine);
    engine.setValue('name', 'Ada');
    engine.setErrors({ phone: 'Taken' });
    engine.setFieldLoading('phone', true);
    await engine.back();
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps a frozen snapshot until the next value change', () => {
    const engine = new FormEngine(definition, { country: 'US' });
    const snapshot = engine.getValuesSnapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(snapshot).toEqual(engine.values);
    expect(snapshot).not.toBe(engine.values);
    engine.setErrors({ country: 'Bad' });
    expect(engine.getValuesSnapshot()).toBe(snapshot);
    engine.setValue('country', 'JP');
    const next = engine.getValuesSnapshot();
    expect(next).not.toBe(snapshot);
    expect(next.country).toBe('JP');
    expect(snapshot.country).toBe('US');
  });

  it('hands listeners the fresh snapshot and allows writes inside a listener', () => {
    const engine = new FormEngine(definition);
    const seen: unknown[] = [];
    engine.subscribeValues(() => {
      const values = engine.getValuesSnapshot();
      seen.push(values.country);
      if (values.country === 'US') engine.setValue('region', 'CA');
    });
    engine.setValue('country', 'US');
    expect(seen).toEqual(['US', 'US']);
    expect(engine.getValuesSnapshot()).toMatchObject({ country: 'US', region: 'CA' });
  });

  it('stops notifying after unsubscribe', () => {
    const engine = new FormEngine(definition);
    const listener = vi.fn();
    const unsubscribe = engine.subscribeValues(listener);
    unsubscribe();
    engine.setValue('country', 'US');
    expect(listener).not.toHaveBeenCalled();
  });
});
