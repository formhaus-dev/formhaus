import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateDefinition } from '../../src';
import { routedDefinition } from './form-engine-routes.fixtures';

describe('declarative step routes', () => {
  it('uses ordered predicates, fallback and explicit convergence for progress and Back', async () => {
    const engine = new FormEngine(routedDefinition(), { kind: 'business', company: 'Acme' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business', 'review']);
    expect(engine.progress).toEqual({ current: 1, total: 3 });
    expect(await engine.nextStepAsync()).toBe(true);
    expect(engine.currentStep?.id).toBe('business');
    expect(await engine.nextStepAsync()).toBe(true);
    expect(engine.currentStep?.id).toBe('review');
    expect(await engine.prevStepAsync()).toBe(true);
    expect(engine.currentStep?.id).toBe('business');
    engine.prevStep();
    engine.setValue('kind', 'personal');
    expect(engine.nextStep()).toBe(true);
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('retains skipped answers but omits them from validation, hooks and payload', async () => {
    let submitted: Record<string, unknown> | undefined;
    let hookValues: Record<string, unknown> | undefined;
    const engine = new FormEngine(routedDefinition(), { kind: 'business', company: 'Acme', name: '' }, {
      onBeforeStepChange: ({ values }) => { hookValues = values; },
    });
    expect(engine.validate()).toEqual({});
    expect(engine.getSubmitValues()).toEqual({ kind: 'business', company: 'Acme' });
    await engine.nextStepAsync();
    expect(hookValues).toEqual({ kind: 'business', company: 'Acme' });
    await engine.submitAsync((values) => { submitted = values; });
    expect(submitted).toEqual({ kind: 'business', company: 'Acme' });
    engine.setValue('kind', 'personal');
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.values.company).toBe('Acme');
    expect(engine.validate()).toEqual({ name: 'This field is required' });
    engine.setValue('kind', 'business');
    expect(engine.getSubmitValues().company).toBe('Acme');
  });

  it('reconciles from an obsolete branch to the nearest common predecessor', () => {
    const engine = new FormEngine(routedDefinition(), { kind: 'business', company: 'Acme' });
    engine.nextStep();
    engine.setValue('kind', 'personal');
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.currentStepIndex).toBe(0);
    engine.nextStep();
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('skips invisible targets and reevaluates when their visibility changes', () => {
    const definition = routedDefinition();
    definition.steps![1].show = [{ field: 'enabled', eq: true }];
    const engine = new FormEngine(definition, { kind: 'business', enabled: true, company: 'Acme' });
    engine.nextStep();
    engine.setValue('enabled', false);
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.values.company).toBeUndefined();
  });

  it('supports showAny, default-next when no route matches, and explicit terminal steps', () => {
    const definition = routedDefinition();
    definition.steps![0].routes = [{ to: 'personal', showAny: [{ field: 'kind', eq: 'personal' }] }];
    definition.steps![1].routes = [{ to: null }];
    const engine = new FormEngine(definition, { kind: 'business', company: 'Acme' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business']);
    engine.nextStep();
    expect(engine.isLastStep).toBe(true);
    expect(engine.nextStep()).toBe(false);
  });

  it('does not let retained answers from skipped branches select routes', () => {
    const definition = routedDefinition();
    definition.steps![2].routes = [
      { to: null, show: [{ field: 'company', eq: 'Old company' }] },
      { to: 'review' },
    ];
    const engine = new FormEngine(definition, { kind: 'personal', company: 'Old company' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
    expect(engine.values.company).toBe('Old company');
  });

  it.each(['missing', 'kind', 'business'])('rejects missing or non-forward target %s', (to) => {
    const definition = routedDefinition();
    definition.steps![1].routes = [{ to }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    expect(validateDefinition(definition).some((warning) => /route/i.test(warning))).toBe(true);
  });

  it('rejects future and missing predicate fields and duplicate step ids', () => {
    const definition = routedDefinition();
    definition.steps![0].routes![0].show = [{ field: 'company', notEmpty: true }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    definition.steps![0].routes![0].show = [{ field: 'missing', notEmpty: true }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    definition.steps![0].routes![0].show = [];
    definition.steps![1].id = 'kind';
    expect(() => new FormEngine(definition)).toThrow(/route/i);
  });

  it('drops pending validation when changing an answer changes the path', async () => {
    let resolve!: () => void;
    const engine = new FormEngine(routedDefinition(), { kind: 'business' }, {
      onBeforeStepChange: () => new Promise<void>((done) => { resolve = done; }),
    });
    const pending = engine.nextStepAsync();
    engine.setValue('kind', 'personal');
    resolve();
    expect(await pending).toBe(false);
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
  });

  it('warns when a branch falls through into its sibling branch', () => {
    const definition = routedDefinition();
    expect(validateDefinition(definition).filter((warning) => /sibling/.test(warning))).toEqual([]);
    delete definition.steps![1].routes;
    expect(validateDefinition(definition)).toContain(
      'Route branch "business" from "kind" continues into sibling branch "personal". Add an unconditional route where it should continue.',
    );
    expect(() => new FormEngine(definition)).not.toThrow();
  });

  it('discards a pending submission when a route answer switches branches', async () => {
    let allow!: () => void;
    const send = vi.fn();
    const engine = new FormEngine(routedDefinition(), { kind: 'personal', name: 'Ada', company: 'Retained' }, {
      onBeforeSubmit: () => new Promise<void>((done) => { allow = done; }),
    });
    const pending = engine.submitAsync(send);
    engine.setValue('kind', 'business');
    allow();
    expect(await pending).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
