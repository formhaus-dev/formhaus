import { expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { routedDefinition } from './form-engine-routes.fixtures';

it('keeps validation values and canGoNext consistent on a routed path', () => {
  const definition = routedDefinition();
  definition.steps![2].fields[0].validation = { validator: 'activeOnly' };
  const engine = new FormEngine(definition, { kind: 'personal', company: 'Retained', name: 'Ada' }, {
    validators: { activeOnly: (_value, values) => values.company ? 'Inactive value leaked' : null },
  });
  engine.nextStep();
  expect(engine.canGoNext).toBe(true);
  expect(engine.validate()).toEqual({});
});

it('does not let a retained inactive answer hide a target through show conditions', () => {
  const definition = routedDefinition();
  definition.steps![3].show = [{ field: 'company', neq: 'Retained' }];
  const engine = new FormEngine(definition, { kind: 'personal', company: 'Retained' });
  expect(engine.visibleSteps.map((step) => step.id)).toEqual(['kind', 'personal', 'review']);
});

it('uses one scoped view for displayed fields, field errors and navigation validation', () => {
  const definition = routedDefinition();
  definition.steps![2].fields[0].show = [{ field: 'company', neq: 'Retained' }];
  const engine = new FormEngine(definition, { kind: 'personal', company: 'Retained', name: 'Ada' });
  engine.nextStep();
  expect(engine.visibleFields.map((field) => field.key)).toEqual(['name']);
  expect(engine.values.name).toBe('Ada');
  engine.setValue('name', '');
  expect(engine.canGoNext).toBe(false);
  expect(engine.nextStep()).toBe(false);
  expect(engine.errors.name).toBe('This field is required');
  engine.setErrors({ name: 'Server rejected name' });
  expect(engine.topLevelErrors).toEqual([]);
  expect(engine.errors.name).toBe('Server rejected name');
});

it('preserves conditional answers inside an inactive restored branch until it becomes active', () => {
  const definition = routedDefinition();
  definition.steps![1].fields = [
    { key: 'companyType', type: 'text', label: 'Type' },
    { key: 'taxId', type: 'text', label: 'Tax ID', show: [{ field: 'companyType', eq: 'llc' }] },
  ];
  const engine = new FormEngine(definition, { kind: 'personal', companyType: 'llc', taxId: 'ABC-123' });
  expect(engine.values.taxId).toBe('ABC-123');
  engine.setValue('kind', 'business');
  expect(engine.getSubmitValues().taxId).toBe('ABC-123');
  engine.setValue('companyType', 'sole');
  expect(engine.values.taxId).toBeUndefined();
});
