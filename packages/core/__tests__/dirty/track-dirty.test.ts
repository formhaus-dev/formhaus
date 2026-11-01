import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type FormDefinition } from '../../src';
import { trackDirty } from '../../src/dirty';

const definition: FormDefinition = {
  id: 'profile',
  title: 'Profile',
  submit: { label: 'Save' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

describe('trackDirty', () => {
  it('notifies only when the dirty keys change', () => {
    const engine = new FormEngine(definition, { name: 'Ada' });
    const tracker = trackDirty(engine);
    const listener = vi.fn();
    tracker.subscribe(listener);
    engine.setValue('name', 'Grace');
    engine.setValue('name', 'Grace ');
    expect(listener).toHaveBeenCalledTimes(1);
    engine.setValue('email', 'a@b.co');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(tracker.dirtyKeys).toEqual(['email', 'name']);
  });

  it('keeps the same keys array while the keys do not change', () => {
    const engine = new FormEngine(definition);
    const tracker = trackDirty(engine);
    engine.setValue('name', 'Ada');
    const keys = tracker.dirtyKeys;
    engine.setValue('name', 'Grace');
    expect(tracker.dirtyKeys).toBe(keys);
  });

  it('takes the values of a plain engine reset as the baseline', () => {
    const engine = new FormEngine(definition, { name: 'Ada' });
    const tracker = trackDirty(engine);
    const states: boolean[] = [];
    tracker.subscribe(() => states.push(tracker.dirty));
    engine.reset({ name: 'Lin' });
    engine.setValue('name', 'Ada');
    tracker.markClean();
    expect(states).toEqual([true, false]);
  });

  it('stops following the engine after stop', () => {
    const engine = new FormEngine(definition);
    const tracker = trackDirty(engine);
    const listener = vi.fn();
    tracker.subscribe(listener);
    tracker.stop();
    engine.setValue('name', 'Ada');
    expect(listener).not.toHaveBeenCalled();
    expect(tracker.dirty).toBe(false);
  });
});
