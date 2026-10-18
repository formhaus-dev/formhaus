import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { basicDefinition } from './form-engine.fixtures';

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
});
