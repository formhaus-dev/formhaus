import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src';
import { routedDefinition } from './form-engine-routes.fixtures';

describe('declarative step routes', () => {
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
});
