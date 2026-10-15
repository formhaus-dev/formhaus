import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src';
import { routedDefinition } from './form-engine-routes.fixtures';

describe('declarative step routes', () => {
  it('uses ordered predicates, fallback and explicit convergence for progress and Back', async () => {
    const engine = new FormEngine(routedDefinition(), { kind: 'business', company: 'Acme' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business', 'review']);
    expect(engine.progress).toEqual({ current: 1, total: 3 });
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('business');
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('review');
    expect(await engine.back()).toBe(true);
    expect(engine.currentStep?.id).toBe('business');
    await engine.back();
    engine.setValue('kind', 'personal');
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('retains skipped answers but omits them from validation, hooks and payload', async () => {
    let submitted: Record<string, unknown> | undefined;
    let hookValues: Record<string, unknown> | undefined;
    const engine = new FormEngine(
      routedDefinition(),
      { kind: 'business', company: 'Acme', name: '' },
      {
        onBeforeStepChange: ({ values }) => {
          hookValues = values;
        },
      },
    );
    expect(engine.validate()).toEqual({});
    expect(engine.getSubmitValues()).toEqual({ kind: 'business', company: 'Acme' });
    await engine.next();
    expect(hookValues).toEqual({ kind: 'business', company: 'Acme' });
    await engine.submit((values) => {
      submitted = values;
    });
    expect(submitted).toEqual({ kind: 'business', company: 'Acme' });
    engine.setValue('kind', 'personal');
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.values.company).toBe('Acme');
    expect(engine.validate()).toEqual({ name: 'This field is required' });
    engine.setValue('kind', 'business');
    expect(engine.getSubmitValues().company).toBe('Acme');
  });

  it('reconciles from an obsolete branch to the nearest common predecessor', async () => {
    const engine = new FormEngine(routedDefinition(), { kind: 'business', company: 'Acme' });
    await engine.next();
    engine.setValue('kind', 'personal');
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.currentStepIndex).toBe(0);
    await engine.next();
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('skips invisible targets and reevaluates when their visibility changes', async () => {
    const definition = routedDefinition();
    definition.steps![1].show = [{ field: 'enabled', eq: true }];
    const engine = new FormEngine(definition, { kind: 'business', enabled: true, company: 'Acme' });
    await engine.next();
    engine.setValue('enabled', false);
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.values.company).toBeUndefined();
  });

  it('supports showAny, default-next when no route matches, and explicit terminal steps', async () => {
    const definition = routedDefinition();
    definition.steps![0].routes = [{ to: 'personal', showAny: [{ field: 'kind', eq: 'personal' }] }];
    definition.steps![1].routes = [{ to: null }];
    const engine = new FormEngine(definition, { kind: 'business', company: 'Acme' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'business']);
    await engine.next();
    expect(engine.isLastStep).toBe(true);
    expect(await engine.next()).toBe(false);
  });

  it('does not let retained answers from skipped branches select routes', () => {
    const definition = routedDefinition();
    definition.steps![2].routes = [{ to: null, show: [{ field: 'company', eq: 'Old company' }] }, { to: 'review' }];
    const engine = new FormEngine(definition, { kind: 'personal', company: 'Old company' });
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
    expect(engine.values.company).toBe('Old company');
  });

  it.each(['missing', 'kind', 'business'])('rejects missing or non-forward target %s', (to) => {
    const definition = routedDefinition();
    definition.steps![1].routes = [{ to }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    expect(checkDefinition(definition).map((issue) => issue.code)).toContain('route-target');
  });

  it('rejects future and missing predicate fields and duplicate step ids', () => {
    const definition = routedDefinition();
    definition.steps![0].routes![0].show = [{ field: 'company', notEmpty: true }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    definition.steps![0].routes![0].show = [{ field: 'missing', notEmpty: true }];
    expect(() => new FormEngine(definition)).toThrow(/route/i);
    definition.steps![0].routes![0].show = [];
    definition.steps![1].id = 'kind';
    expect(() => new FormEngine(definition)).toThrow('/steps/1/id: step id "kind" is already used by /steps/0.');
  });

  it('drops pending validation when changing an answer changes the path', async () => {
    let resolve!: () => void;
    const engine = new FormEngine(
      routedDefinition(),
      { kind: 'business' },
      {
        onBeforeStepChange: () =>
          new Promise<void>((done) => {
            resolve = done;
          }),
      },
    );
    const pending = engine.next();
    engine.setValue('kind', 'personal');
    resolve();
    expect(await pending).toBe(false);
    expect(engine.currentStep?.id).toBe('kind');
    expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
  });

  it('warns when a branch falls through into its sibling branch', () => {
    const definition = routedDefinition();
    expect(checkDefinition(definition).filter((issue) => issue.code === 'route-fallthrough')).toEqual([]);
    delete definition.steps![1].routes;
    expect(checkDefinition(definition)).toContainEqual({
      code: 'route-fallthrough',
      severity: 'warning',
      path: '/steps/1',
      message:
        '/steps/1: branch "business" from "kind" continues into the sibling branch "personal". Add an unconditional route on "business" to the step where the branches meet.',
      hint: 'Add an unconditional route on "business" to the step where the branches meet.',
    });
    expect(() => new FormEngine(definition)).not.toThrow();
  });

  it('discards a pending submission when a route answer switches branches', async () => {
    let allow!: () => void;
    const send = vi.fn();
    const engine = new FormEngine(
      routedDefinition(),
      { kind: 'personal', name: 'Ada', company: 'Retained' },
      {
        onBeforeSubmit: () =>
          new Promise<void>((done) => {
            allow = done;
          }),
      },
    );
    const pending = engine.submit(send);
    engine.setValue('kind', 'business');
    allow();
    expect(await pending).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
