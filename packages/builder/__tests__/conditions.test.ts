import { describe, expect, it } from 'vitest';
import {
  addField,
  addStep,
  createForm,
  END,
  findIssues,
  fromDefinition,
  logicOf,
  operatorsFor,
  removeField,
  routesOf,
  setLogic,
  setRoutes,
  stepTargetsAfter,
  toCondition,
  toDefinition,
  fromCondition,
  conditionSources,
} from '../src';

function plans() {
  const form = createForm('plans', 'Plans');
  const plan = addField(form, { step: null }, { type: 'radio', label: 'Plan' });
  plan.options[0].label = 'Free';
  plan.options[1].label = 'Pro';
  const seats = addField(form, { step: null }, { type: 'number', label: 'Seats' });
  const agree = addField(form, { step: null }, { type: 'checkbox', label: 'Agree' });
  const company = addField(form, { step: null }, { label: 'Company' });
  toDefinition(form);
  return { form, plan, seats, agree, company };
}

describe('operators', () => {
  it('follows the source type', () => {
    expect(operatorsFor('radio')).toEqual(['eq', 'neq', 'in', 'notIn', 'notEmpty']);
    expect(operatorsFor('email')).toEqual(['eq', 'neq', 'notEmpty']);
    expect(operatorsFor('switch')).toEqual(['checked', 'unchecked']);
    expect(operatorsFor('multiselect')).toEqual(['contains', 'notContains', 'notEmpty']);
  });

  it('writes and reads contains for list questions', () => {
    expect(toCondition({ field: 'interests', operator: 'contains', value: 'other' }, 'multiselect')).toEqual({
      field: 'interests',
      contains: 'other',
    });
    expect(fromCondition({ field: 'interests', notContains: 'other' }, 'multiselect')).toEqual({
      field: 'interests',
      operator: 'notContains',
      value: 'other',
    });
  });

  it('stores numbers as numbers and toggles as booleans', () => {
    expect(toCondition({ field: 'seats', operator: 'eq', value: '5' }, 'number')).toEqual({ field: 'seats', eq: 5 });
    expect(toCondition({ field: 'agree', operator: 'unchecked', value: '' }, 'checkbox')).toEqual({ field: 'agree', eq: false });
    expect(toCondition({ field: 'plan', operator: 'in', value: ['free', 'pro'] }, 'radio')).toEqual({ field: 'plan', in: ['free', 'pro'] });
  });

  it('reads back the conditions it writes', () => {
    expect(fromCondition({ field: 'agree', eq: true }, 'checkbox')).toEqual({ field: 'agree', operator: 'checked', value: '' });
    expect(fromCondition({ field: 'plan', notIn: ['pro'] }, 'radio')).toEqual({ field: 'plan', operator: 'notIn', value: ['pro'] });
    expect(fromCondition({ field: 'plan', eq: 'pro', neq: 'free' }, 'radio')).toBeUndefined();
  });
});

describe('logic', () => {
  it('writes show for all and showAny for any', () => {
    const { form, plan, company } = plans();
    setLogic(form, company.uid, 'all', [{ field: plan.key, operator: 'eq', value: 'pro' }]);
    expect(toDefinition(form).fields?.[3].show).toEqual([{ field: 'plan', eq: 'pro' }]);
    setLogic(form, company.uid, 'any', [{ field: plan.key, operator: 'notEmpty', value: '' }]);
    expect(toDefinition(form).fields?.[3]).toMatchObject({ showAny: [{ field: 'plan', notEmpty: true }] });
    expect(logicOf(form, company)).toEqual({ mode: 'any', rows: [{ field: 'plan', operator: 'notEmpty', value: '' }], editable: true });
    setLogic(form, company.uid, 'always', []);
    expect(toDefinition(form).fields?.[3].showAny).toBeUndefined();
  });

  it('marks show plus showAny as not editable', () => {
    const { form, company } = plans();
    company.extra.show = [{ field: 'plan', eq: 'pro' }];
    company.extra.showAny = [{ field: 'seats', notEmpty: true }];
    expect(logicOf(form, company).editable).toBe(false);
  });

  it('offers only earlier fields as sources', () => {
    const { form, seats } = plans();
    expect(conditionSources(form, seats.uid).map((item) => item.key)).toEqual(['plan']);
  });

  it('drops conditions on a deleted field and flags later fields', () => {
    const { form, plan, seats, company } = plans();
    setLogic(form, company.uid, 'all', [
      { field: 'plan', operator: 'eq', value: 'pro' },
      { field: 'seats', operator: 'notEmpty', value: '' },
    ]);
    removeField(form, plan.uid);
    expect(toDefinition(form).fields?.[2].show).toEqual([{ field: 'seats', notEmpty: true }]);
    setLogic(form, seats.uid, 'all', [{ field: 'company', operator: 'notEmpty', value: '' }]);
    expect(findIssues(form)).toContainEqual({
      uid: seats.uid,
      severity: 'warning',
      message: 'The "Shown when" condition uses "company", which comes later.',
    });
  });

  it('names a condition on a missing field', () => {
    const { form, seats } = plans();
    setLogic(form, seats.uid, 'all', [{ field: 'gone', operator: 'notEmpty', value: '' }]);
    expect(findIssues(form)).toContainEqual({
      uid: seats.uid,
      severity: 'error',
      message: 'The "Shown when" condition uses "gone", which is not a field.',
    });
  });
});

describe('branching and routes', () => {
  it('serializes End form as a null route and parses it back', () => {
    const { form, plan } = plans();
    const second = addStep(form);
    addField(form, { step: second.uid }, { label: 'Team size' });
    plan.options[0].jump = END;
    plan.options[1].jump = second.uid;
    const definition = toDefinition(form);
    expect(definition.steps?.[0].routes).toEqual([{ to: null, show: [{ field: 'plan', eq: 'free' }] }, { to: 'step-2' }]);
    const back = fromDefinition(definition);
    expect(toDefinition(back)).toEqual(definition);
    const parsed = back.blocks.find((block) => block.kind === 'question' && block.key === 'plan');
    expect(parsed && parsed.kind === 'question' && parsed.options[0].jump).toBe(END);
  });

  it('sets custom routes and clears simple branching on that step', () => {
    const { form, plan } = plans();
    const first = form.blocks.find((block) => block.kind === 'page');
    const second = addStep(form);
    addField(form, { step: second.uid }, { label: 'Team size' });
    const start = addStep(form, undefined);
    addField(form, { step: start.uid }, { label: 'Notes' });
    const step = form.blocks.find((block) => block.kind === 'page') ?? first;
    plan.options[1].jump = second.uid;
    setRoutes(form, step!.uid, [{ to: 'step-3', show: [{ field: 'plan', eq: 'pro' }] }, { to: 'step-2' }]);
    expect(plan.options[1].jump).toBeNull();
    expect(routesOf(form, step!.uid)).toHaveLength(2);
    expect(toDefinition(form).steps?.[0].routes?.[0].to).toBe('step-3');
    expect(stepTargetsAfter(form, step!.uid).map((target) => target.id)).toEqual(['step-2', 'step-3']);
    setRoutes(form, step!.uid, undefined);
    expect(toDefinition(form).steps?.[0].routes).toBeUndefined();
  });

  it('treats routes with reordered keys as the simple model', () => {
    const { form, plan } = plans();
    const second = addStep(form);
    addField(form, { step: second.uid }, { label: 'Team size' });
    plan.options[0].jump = END;
    const definition = JSON.parse(JSON.stringify(toDefinition(form)).replace('"field":"plan","eq":"free"', '"eq":"free","field":"plan"'));
    const back = fromDefinition(definition);
    expect(back.blocks.some((block) => block.kind === 'page' && block.routes)).toBe(false);
  });
});
