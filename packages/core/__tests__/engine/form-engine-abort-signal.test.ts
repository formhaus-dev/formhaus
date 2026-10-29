import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { multiStepDefinition } from './form-engine-steps.fixtures';

const singleStep: FormDefinition = {
  id: 'single',
  title: 'Single',
  submit: { label: 'Submit' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

describe('FormEngine abort signal', () => {
  it('aborts step validation when a checked value changes', async () => {
    const gate = deferred<null>();
    let signal: AbortSignal | undefined;
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ann' },
      {
        onStepValidate: (_, __, received) => {
          signal = received;
          return gate.promise;
        },
      },
    );
    const moving = engine.next();
    expect(signal?.aborted).toBe(false);
    engine.setValue('name', 'Bob');
    expect(signal?.aborted).toBe(true);
    gate.resolve(null);
    await expect(moving).resolves.toBe(false);
  });

  it('aborts the before-step hook when pending actions are cancelled', async () => {
    let signal: AbortSignal | undefined;
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ann' },
      {
        onBeforeStepChange: (_, received) => {
          signal = received;
          return new Promise<boolean>(() => {});
        },
      },
    );
    void engine.next();
    await Promise.resolve();
    expect(signal?.aborted).toBe(false);
    engine.cancelPendingActions();
    expect(signal?.aborted).toBe(true);
  });

  it('aborts submit validation on reset', async () => {
    const gate = deferred<null>();
    let signal: AbortSignal | undefined;
    const engine = new FormEngine(
      singleStep,
      { email: 'a@b.co' },
      {
        onValidate: (_, __, received) => {
          signal = received;
          return gate.promise;
        },
      },
    );
    const submitting = engine.submit(() => {});
    engine.reset();
    expect(signal?.aborted).toBe(true);
    gate.resolve(null);
    await expect(submitting).resolves.toBe(false);
  });

  it('rejects quietly when a hook throws after abort', async () => {
    const engine = new FormEngine(
      singleStep,
      { email: 'a@b.co' },
      {
        onBeforeSubmit: (_, signal) =>
          new Promise<boolean>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
      },
    );
    const submitting = engine.submit(() => {});
    await Promise.resolve();
    engine.setValue('email', 'c@d.co');
    await expect(submitting).resolves.toBe(false);
  });

  it('keeps the signal live once the operation settles', async () => {
    const signals: AbortSignal[] = [];
    const engine = new FormEngine(
      singleStep,
      { email: 'a@b.co' },
      {
        onValidate: (_, __, signal) => void signals.push(signal),
        onBeforeSubmit: (_, signal) => void signals.push(signal),
      },
    );
    await expect(engine.submit(() => {})).resolves.toBe(true);
    engine.setValue('email', 'c@d.co');
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
  });

  it('keeps the signal live after a step change', async () => {
    const signals: AbortSignal[] = [];
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ann' },
      {
        onStepValidate: async (_, __, signal) => void signals.push(signal),
        onValidate: (_, __, signal) => void signals.push(signal),
        onBeforeStepChange: (_, signal) => void signals.push(signal),
      },
    );
    await expect(engine.next()).resolves.toBe(true);
    expect(signals).toHaveLength(3);
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
  });

  it('does not abort the submit handler', async () => {
    const gate = deferred<void>();
    const engine = new FormEngine(
      singleStep,
      { email: 'a@b.co' },
      {
        onBeforeSubmit: (_, signal) => {
          gate.promise.then(() => expect(signal.aborted).toBe(false));
        },
      },
    );
    const submitting = engine.submit(() => gate.promise);
    await Promise.resolve();
    await Promise.resolve();
    engine.setValue('email', 'c@d.co');
    gate.resolve();
    await submitting;
  });
});
