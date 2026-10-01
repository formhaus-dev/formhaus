import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { basicDefinition, conditionalDefinition } from './form-engine.fixtures';

describe('FormEngine subscriptions, reset and loading', () => {
  it('increments the form snapshot on mutation', () => {
    const engine = new FormEngine(basicDefinition);
    const snapshot = engine.getSnapshot();
    engine.setValue('name', 'test');
    expect(engine.getSnapshot()).toBe(snapshot + 1);
  });

  it('stops notifying an unsubscribed listener', () => {
    const engine = new FormEngine(basicDefinition);
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    engine.setValue('name', 'test');
    unsubscribe();
    engine.setValue('name', 'test2');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('notifies multiple subscribers independently', () => {
    const engine = new FormEngine(basicDefinition);
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = engine.subscribe(first);
    engine.subscribe(second);
    engine.setValue('name', 'test');
    unsubscribeFirst();
    engine.setValue('name', 'test2');
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('resets values and errors to field defaults', () => {
    const definition: FormDefinition = {
      id: 'reset',
      title: 'Reset',
      submit: { label: 'Submit' },
      fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'default' }],
    };
    const engine = new FormEngine(definition, { name: 'modified' });
    engine.errors = { name: 'error' };
    engine.reset();
    expect(engine.values.name).toBe('default');
    expect(engine.errors).toEqual({});
  });

  it('resets to provided values', () => {
    const engine = new FormEngine(basicDefinition, { name: 'modified' });
    engine.reset({ name: 'new' });
    expect(engine.values.name).toBe('new');
  });

  it('clears values for fields hidden by the reset values', () => {
    const engine = new FormEngine(conditionalDefinition);
    engine.reset({ country: 'MX', routing: 'STALE' });
    expect(engine.values.routing).toBeUndefined();

    engine.setValue('country', 'US');
    expect(engine.values.routing).toBeUndefined();
  });

  it('clears values for fields hidden by the initial values', () => {
    const engine = new FormEngine(conditionalDefinition, { country: 'MX', routing: 'STALE' });
    expect(engine.values.routing).toBeUndefined();

    engine.setValue('country', 'US');
    expect(engine.values.routing).toBeUndefined();
  });

  it('clears values in steps hidden by the reset values', () => {
    const definition: FormDefinition = {
      id: 'hidden-step-reset',
      title: 'Hidden step reset',
      submit: { label: 'Submit' },
      steps: [
        { id: 'main', title: 'Main', fields: [{ key: 'accountType', type: 'text', label: 'Type' }] },
        {
          id: 'business',
          title: 'Business',
          fields: [
            { key: 'taxId', type: 'text', label: 'Tax ID' },
            { key: 'vat', type: 'text', label: 'VAT' },
          ],
          show: [{ field: 'accountType', eq: 'business' }],
        },
      ],
    };
    const engine = new FormEngine(definition);
    engine.reset({ accountType: 'personal', taxId: 'STALE', vat: 'STALE' });
    expect(engine.values.taxId).toBeUndefined();
    expect(engine.values.vat).toBeUndefined();
  });

  it('sets and clears field loading state', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setFieldLoading('name', true);
    expect(engine.fieldLoading.name).toBe(true);
    engine.setFieldLoading('name', false);
    expect(engine.fieldLoading.name).toBeUndefined();
  });

  it('clears field loading state on reset', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setFieldLoading('name', true);
    engine.reset();
    expect(engine.fieldLoading).toEqual({});
  });
});
