import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import { deferred, flatApi, valid } from './flat-api.fixtures';

const atLastStep = (values: Record<string, unknown> = valid, options = {}) => {
  const engine = new FormEngine(flatApi, values, options);
  engine.goToStepWithField('postcode');
  return engine;
};

describe('submit results', () => {
  it('treats a handler that returns nothing as a success', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    expect(await engine.submit(async () => {})).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledTimes(1);
    expect(onAfterSubmit).toHaveBeenCalledWith(valid, []);
  });

  it('runs the after-hook exactly once for { ok: true } and clears earlier server errors', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    expect(await engine.submit(() => ({ ok: false, errors: { email: 'Taken' }, formErrors: ['Try later'] }))).toBe(false);
    expect(onAfterSubmit).not.toHaveBeenCalled();
    expect(await engine.submit(() => ({ ok: true }))).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledTimes(1);
    expect(engine.errors).toEqual({});
    expect(engine.topLevelErrors).toEqual([]);
  });

  it('applies errors from the first and the last step at once and opens the earliest step', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    const result = await engine.submit(() => ({ ok: false, errors: { postcode: 'Unknown postcode', firstName: 'Use your legal name' } }));
    expect(result).toBe(false);
    expect(onAfterSubmit).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({ postcode: 'Unknown postcode', firstName: 'Use your legal name' });
    expect(engine.currentStep?.id).toBe('about');
    expect(engine.values).toEqual(valid);
    expect(engine.submitting).toBe(false);
  });

  it('opens the earliest step for setErrors() whatever the key order', () => {
    const engine = atLastStep();
    engine.setErrors({ postcode: 'Bad', accountType: 'Not available', firstName: 'Bad' });
    expect(engine.currentStep?.id).toBe('about');
    expect(engine.stepErrors).toEqual({ about: ['firstName'], account: ['accountType'], address: ['postcode'] });
  });

  it('shows unknown keys, hidden fields and formErrors as form-level errors', async () => {
    const engine = atLastStep();
    await engine.submit(() => ({
      ok: false,
      errors: { account_status: 'Account is locked', companyName: 'Company not found', street: 'No such street' },
      formErrors: ['Something went wrong'],
    }));
    expect(engine.errors).toEqual({ street: 'No such street' });
    expect(engine.topLevelErrors).toEqual(['Something went wrong', 'Account is locked', 'Company not found']);
    expect(engine.currentStep?.id).toBe('address');
  });

  it('keeps values and server errors when the handler throws', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    await engine.submit(() => ({ ok: false, errors: { email: 'Taken' } }));
    engine.goToStepWithField('postcode');
    await expect(engine.submit(async () => { throw new TypeError('Failed to fetch'); })).rejects.toThrow('Failed to fetch');
    expect(onAfterSubmit).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({ email: 'Taken' });
    expect(engine.values).toEqual(valid);
    expect(engine.submitting).toBe(false);
  });

  it('rejects { ok: false } without messages', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    expect(await engine.submit(() => ({ ok: false }))).toBe(false);
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it('treats non-plain return values as a success, as before', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    class Response { ok = false; }
    expect(await engine.submit((() => new Response()) as never)).toBe(true);
    expect(await engine.submit((() => 'saved') as never)).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledTimes(2);
  });

  it('sends a new submission while server errors are still shown and replaces them with the new response', async () => {
    const engine = atLastStep();
    await engine.submit(() => ({ ok: false, errors: { email: 'Taken', postcode: 'Unknown' } }));
    const handler = vi.fn(() => ({ ok: false as const, errors: { postcode: 'Still unknown' } }));
    expect(await engine.submit(handler)).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(engine.errors).toEqual({ postcode: 'Still unknown' });
    expect(engine.currentStep?.id).toBe('address');
  });

  it('passes the skipped steps and restores a skipped step after a rejection', async () => {
    const definition = { ...flatApi, steps: flatApi.steps!.map((step) => step.id === 'address' ? { ...step, skip: { label: 'Later' } } : step) };
    const engine = new FormEngine(definition, valid);
    engine.goToStepWithField('postcode');
    const handler = vi.fn(() => ({ ok: false as const, errors: { email: 'Taken' } }));
    expect(await engine.skip(handler)).toBe(false);
    expect(handler.mock.calls[0][1]).toEqual(['address']);
    expect(engine.isStepSkipped('address')).toBe(false);
    expect(engine.values.postcode).toBe('10115');
    expect(engine.errors).toEqual({ email: 'Taken' });
  });
});

describe('submit races', () => {
  it('ignores a second submit while the first one is pending', async () => {
    const response = deferred<{ ok: true }>();
    const handler = vi.fn(() => response.promise);
    const engine = atLastStep();
    const first = engine.submit(handler);
    expect(await engine.submit(handler)).toBe(false);
    response.resolve({ ok: true });
    expect(await first).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(['reset', 'cancel'])('ignores a response that arrives after %s', async (action) => {
    const response = deferred<{ ok: false; errors: Record<string, string> }>();
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    const pending = engine.submit(() => response.promise);
    if (action === 'reset') engine.reset({ firstName: 'Grace' });
    else engine.cancelPendingActions();
    response.resolve({ ok: false, errors: { firstName: 'Old' } });
    expect(await pending).toBe(false);
    expect(engine.errors).toEqual({});
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it('ignores a stale success after cancelPendingActions()', async () => {
    const response = deferred<void>();
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    const pending = engine.submit(() => response.promise);
    engine.cancelPendingActions();
    response.resolve();
    expect(await pending).toBe(true);
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it('drops errors for fields edited while the request was running', async () => {
    const response = deferred<{ ok: false; errors: Record<string, string> }>();
    const engine = atLastStep();
    const pending = engine.submit(() => response.promise);
    engine.setValue('postcode', '10117');
    response.resolve({ ok: false, errors: { postcode: 'Unknown', email: 'Taken' } });
    expect(await pending).toBe(false);
    expect(engine.errors).toEqual({ email: 'Taken' });
    expect(engine.values.postcode).toBe('10117');
  });

  it('keeps a success when a field changes during the request', async () => {
    const response = deferred<void>();
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    const pending = engine.submit(() => response.promise);
    engine.setValue('street', '2 Main St');
    response.resolve();
    expect(await pending).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledWith(valid, []);
  });
});
