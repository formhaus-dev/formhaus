import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { multiStepDefinition } from './form-engine-steps.fixtures';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('step lifecycle', () => {
  it('validates, allows cancellation, and reports the completed transition', async () => {
    const calls: string[] = [];
    let allow = false;
    const engine = new FormEngine(
      multiStepDefinition,
      {},
      {
        onStepValidate: async () => {
          calls.push('validate');
        },
        onBeforeStepChange: async ({ fromStepId, toStepId, reason }) => {
          calls.push(`${fromStepId}:${toStepId}:${reason}`);
          return allow;
        },
        onAfterStepChange: ({ toStepId }) => {
          calls.push(`after:${toStepId}`);
        },
      },
    );
    expect(await engine.next()).toBe(false);
    expect(calls).toEqual([]);
    engine.setValue('name', 'Ada');
    expect(await engine.next()).toBe(false);
    expect(engine.currentStep?.id).toBe('personal');
    allow = true;
    expect(await engine.next()).toBe(true);
    expect(calls).toEqual(['validate', 'personal:payment:next', 'validate', 'personal:payment:next', 'after:payment']);
    expect(await engine.back()).toBe(true);
    expect(calls.slice(-2)).toEqual(['payment:personal:back', 'after:personal']);
  });

  it('holds the lock through async after hooks and ignores repeated actions', async () => {
    const pending = deferred<void>();
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ada' },
      {
        onAfterStepChange: () => pending.promise,
      },
    );
    const first = engine.next();
    expect(await engine.next()).toBe(false);
    expect(await engine.back()).toBe(false);
    expect(await engine.submit(() => {})).toBe(false);
    pending.resolve();
    expect(await first).toBe(true);
    expect(engine.currentStep?.id).toBe('payment');
    expect(engine.stepValidating).toBe(false);
  });

  it.each(['invalid edit', 'path change', 'reset', 'jump'])('discards stale before-hook work after %s', async (action) => {
    const pending = deferred<void>();
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ada' },
      {
        onBeforeStepChange: () => pending.promise,
      },
    );
    const first = engine.next();
    if (action === 'invalid edit') engine.setValue('name', '');
    if (action === 'path change') engine.setValue('accountType', 'business');
    if (action === 'reset') engine.reset({ name: 'Reset' });
    if (action === 'jump') engine.goToStepWithField('method');
    pending.resolve();
    expect(await first).toBe(false);
    expect(engine.stepValidating).toBe(false);
  });

  it('rejects hook errors and releases the lock for retry', async () => {
    let fail = true;
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ada' },
      {
        onBeforeStepChange: () => {
          if (fail) throw new Error('Offline');
        },
      },
    );
    await expect(engine.next()).rejects.toThrow('Offline');
    expect(engine.currentStep?.id).toBe('personal');
    expect(engine.stepValidating).toBe(false);
    fail = false;
    expect(await engine.next()).toBe(true);
  });
});

describe('submit lifecycle', () => {
  it('validates and awaits before, submit and after in order', async () => {
    const calls: string[] = [];
    const pending = deferred<void>();
    const engine = new FormEngine(
      {
        id: 'one',
        title: '',
        submit: { label: 'Save' },
        fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
      },
      {},
      {
        onBeforeSubmit: () => {
          calls.push('before');
        },
        onAfterSubmit: () => {
          calls.push('after');
        },
      },
    );
    expect(
      await engine.submit(() => {
        calls.push('submit');
      }),
    ).toBe(false);
    expect(calls).toEqual([]);
    engine.setValue('name', 'Ada');
    const first = engine.submit(async (values) => {
      expect(values).toEqual({ name: 'Ada' });
      calls.push('submit');
      await pending.promise;
    });
    await Promise.resolve();
    expect(engine.submitting).toBe(true);
    expect(
      await engine.submit(() => {
        calls.push('duplicate');
      }),
    ).toBe(false);
    pending.resolve();
    expect(await first).toBe(true);
    expect(calls).toEqual(['before', 'submit', 'after']);
    expect(engine.submitting).toBe(false);
  });

  it('cancels before submit and does not run after on a failed submission', async () => {
    let allow = false;
    let sent = 0;
    let after = 0;
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'Ada' },
      {
        onBeforeSubmit: () => allow,
        onAfterSubmit: () => {
          after++;
        },
      },
    );
    expect(
      await engine.submit(() => {
        sent++;
      }),
    ).toBe(false);
    expect(sent).toBe(0);
    allow = true;
    await expect(
      engine.submit(() => {
        throw new Error('Unavailable');
      }),
    ).rejects.toThrow('Unavailable');
    expect(after).toBe(0);
    expect(engine.submitting).toBe(false);
  });
});

it('marks after-hook failures as committed, so they cannot be mistaken for failed actions', async () => {
  const engine = new FormEngine(
    multiStepDefinition,
    { name: 'Ada' },
    {
      onAfterStepChange: () => {
        throw new Error('Analytics unavailable');
      },
      onAfterSubmit: () => {
        throw new Error('Receipt unavailable');
      },
    },
  );
  await expect(engine.next()).rejects.toMatchObject({ committed: true, phase: 'afterStepChange' });
  expect(engine.currentStep?.id).toBe('payment');
  let sent = false;
  await expect(
    engine.submit(() => {
      sent = true;
    }),
  ).rejects.toMatchObject({ committed: true, phase: 'afterSubmit' });
  expect(sent).toBe(true);
  expect(engine.submitting).toBe(false);
});
