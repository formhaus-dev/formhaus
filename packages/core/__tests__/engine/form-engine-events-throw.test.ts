import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormDefinition, FormEvent } from '../../src';
import { FormEngine } from '../../src/engine';

const definition: FormDefinition = {
  id: 'throwing',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

let rethrown: (() => void)[] = [];

beforeEach(() => {
  rethrown = [];
  vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => rethrown.push(callback));
});

afterEach(() => vi.restoreAllMocks());

function throwingOn(type: FormEvent['type'], options = {}) {
  return new FormEngine(
    definition,
    { name: 'Ada' },
    {
      ...options,
      onFormEvent: (event) => {
        if (event.type === type) throw new Error(type);
      },
    },
  );
}

function expectRethrown(type: string) {
  expect(rethrown).toHaveLength(1);
  expect(rethrown[0]).toThrow(type);
}

describe('a throwing onFormEvent', () => {
  it('does not stop next on step_completed', async () => {
    const engine = throwingOn('step_completed');
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('two');
    expect(engine.stepValidating).toBe(false);
    expectRethrown('step_completed');
  });

  it('still calls the handler after form_submitted', async () => {
    const handler = vi.fn();
    const engine = throwingOn('form_submitted');
    expect(await engine.submit(handler)).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expectRethrown('form_submitted');
  });

  it('still runs onAfterSubmit after form_submit_succeeded', async () => {
    const onAfterSubmit = vi.fn();
    const engine = throwingOn('form_submit_succeeded', { onAfterSubmit });
    expect(await engine.submit(() => {})).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledOnce();
    expect(engine.submitting).toBe(false);
    expectRethrown('form_submit_succeeded');
  });

  it('still notifies after form_reset', () => {
    const engine = throwingOn('form_reset');
    engine.start();
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.reset();
    expect(listener).toHaveBeenCalled();
    expect(engine.values).toEqual({});
    expectRethrown('form_reset');
  });

  it('does not stop start or a step change on step_viewed', async () => {
    const engine = throwingOn('step_viewed');
    engine.start();
    expectRethrown('step_viewed');
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('two');
    expect(rethrown).toHaveLength(2);
  });
});
