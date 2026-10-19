import { expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { multiStepDefinition } from './form-engine-steps.fixtures';

it('uses the original callbacks for an already dispatched submission', async () => {
  let resolve!: () => void;
  const calls: string[] = [];
  const options = {
    onAfterSubmit: () => {
      calls.push('A');
    },
  };
  const engine = new FormEngine(multiStepDefinition, { name: 'Ada' }, options);
  const pending = engine.submit(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  options.onAfterSubmit = () => {
    calls.push('B');
  };
  resolve();
  expect(await pending).toBe(true);
  expect(calls).toEqual(['A']);
});

it('locks submission before notifying validation subscribers', async () => {
  let calls = 0;
  let attempted = false;
  const engine = new FormEngine(multiStepDefinition, { name: 'Ada' });
  const send = () => {
    calls++;
  };
  engine.subscribe(() => {
    if (attempted) return;
    attempted = true;
    void engine.submit(send);
  });
  await engine.submit(send);
  expect(calls).toBe(1);
});

it('discards a submission when its before-hook answers an empty field', async () => {
  const send = vi.fn();
  const engine: FormEngine = new FormEngine(
    multiStepDefinition,
    { name: 'Ada' },
    {
      onBeforeStepChange: async () => {
        engine.setValue('company', 'lead-1');
      },
      onBeforeSubmit: async () => {
        engine.setValue('method', 'bank');
      },
    },
  );
  expect(await engine.next()).toBe(true);
  expect(engine.currentStep?.id).toBe('payment');
  expect(await engine.submit(send)).toBe(false);
  expect(send).not.toHaveBeenCalled();
  expect(engine.values.method).toBe('bank');
});

it('discards a submission when a checked value changes during its before-hook', async () => {
  const send = vi.fn();
  const engine: FormEngine = new FormEngine(
    multiStepDefinition,
    { name: 'Ada' },
    {
      onBeforeSubmit: () => {
        engine.setValue('name', 'Grace');
      },
    },
  );
  expect(await engine.submit(send)).toBe(false);
  expect(send).not.toHaveBeenCalled();
});

it('does not dispatch when a listener resets the form during final validation', async () => {
  const send = vi.fn();
  let armed = false;
  const engine: FormEngine = new FormEngine(
    multiStepDefinition,
    { name: 'Ada' },
    {
      onBeforeSubmit: () => {
        armed = true;
      },
    },
  );
  engine.subscribe(() => {
    if (!armed) return;
    armed = false;
    engine.reset({ name: 'Replacement' });
  });
  expect(await engine.submit(send)).toBe(false);
  expect(send).not.toHaveBeenCalled();
});
