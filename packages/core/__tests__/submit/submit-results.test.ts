import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src';
import { flatApi, valid } from './flat-api.fixtures';

const atLastStep = (values: Record<string, unknown> = valid, options = {}) => {
  const engine = new FormEngine(flatApi, values, options);
  engine.goToStepWithField('postcode');
  return engine;
};

describe('submit results', () => {
  it('treats non-plain return values as a success, as before', async () => {
    const onAfterSubmit = vi.fn();
    const engine = atLastStep(valid, { onAfterSubmit });
    class Response {
      ok = false;
    }
    expect(await engine.submit((() => new Response()) as never)).toBe(true);
    expect(await engine.submit((() => 'saved') as never)).toBe(true);
    expect(onAfterSubmit).toHaveBeenCalledTimes(2);
  });
});
