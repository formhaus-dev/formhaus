import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, type FormDefinition, type FormField, type FormStep } from '../../src';

const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const form = (steps: FormStep[]): FormDefinition => ({ id: 'p', title: 'P', submit: { label: 'Send' }, steps });
const choice = (key: string, values: string[], extra: Partial<FormField> = {}): FormField => (
  { key, type: 'radio', label: key, options: values.map((value) => ({ value, label: value })), ...extra }
);

describe('active projection', () => {
  it('keeps the payload when an unrelated route is added', async () => {
    const steps: FormStep[] = [
      { id: 'one', title: 'One', fields: [choice('a', ['yes', 'no']), text('x', { show: [{ field: 'a', eq: 'yes' }] })] },
      { id: 'two', title: 'Two', fields: [text('y')] },
      { id: 'three', title: 'Three', fields: [text('z')] },
    ];
    const run = (definition: FormDefinition) => new FormEngine(definition, { a: 'yes', x: 'kept', y: 'b', z: 'c' }).getSubmitValues();
    const plain = run(form(steps));
    const routed = run(form(steps.map((step) => (step.id === 'two' ? { ...step, routes: [{ to: 'three' }] } : step))));
    expect(plain).toEqual({ a: 'yes', x: 'kept', y: 'b', z: 'c' });
    expect(routed).toEqual(plain);
  });

  it('clears a value written to a hidden field at once, without routes', () => {
    const definition: FormDefinition = { id: 's', title: 'S', submit: { label: 'Send' }, fields: [choice('a', ['yes', 'no']), text('b', { show: [{ field: 'a', eq: 'yes' }] })] };
    const engine = new FormEngine(definition, { a: 'no' });
    engine.setValue('b', 'hidden write');
    expect(engine.values).toEqual({ a: 'no' });
  });

  it('does not let initial values for unknown keys select conditions', () => {
    const definition: FormDefinition = { id: 's', title: 'S', submit: { label: 'Send' }, fields: [text('b')] };
    const engine = new FormEngine(definition, { plan: 'pro' });
    expect(engine.values.plan).toBe('pro');
    expect(engine.getSubmitValues()).toEqual({});
  });

  it('clears the values of a step hidden by its condition', () => {
    const engine = new FormEngine(form([
      { id: 'one', title: 'One', fields: [choice('kind', ['biz', 'me'])] },
      { id: 'biz', title: 'Biz', show: [{ field: 'kind', eq: 'biz' }], fields: [text('company')] },
    ]), { kind: 'biz', company: 'Acme' });
    engine.setValue('kind', 'me');
    expect(engine.values).toEqual({ kind: 'me' });
  });
});

describe('duplicate keys', () => {
  const branches = (): FormDefinition => form([
    { id: 'kind', title: 'Kind', fields: [choice('kind', ['biz', 'me'])], routes: [{ to: 'biz', show: [{ field: 'kind', eq: 'biz' }] }, { to: 'me' }] },
    { id: 'biz', title: 'Biz', fields: [text('name', { label: 'Company', validation: { required: 'Company name' } })], routes: [{ to: 'end' }] },
    { id: 'me', title: 'Me', fields: [text('name', { label: 'Your name', validation: { minLength: 3 } })] },
    { id: 'end', title: 'End', fields: [text('note')] },
  ]);

  it('allows the same key on route branches that never meet', () => {
    expect(checkDefinition(branches())).toEqual([]);
  });

  it('validates the declaration on the active branch', async () => {
    const engine = new FormEngine(branches(), { kind: 'me', name: 'Al' });
    await engine.next();
    expect(engine.currentStep?.id).toBe('me');
    expect(engine.validateField('name')).toBe('Must be at least 3 characters');
    engine.setValue('kind', 'biz');
    engine.setValue('name', '');
    expect(engine.currentStep?.id).toBe('kind');
    await engine.next();
    expect(engine.currentStep?.id).toBe('biz');
    expect(engine.validateField('name')).toBe('Company name');
  });

  it('rejects the same key on steps of one path', () => {
    const definition = branches();
    definition.steps![1].routes = [];
    expect(checkDefinition(definition).map(({ code, path }) => `${code} ${path}`)).toContain('duplicate-key /steps/2/fields/0/key');
  });

  it('rejects the same key twice in one step or form', () => {
    const definition: FormDefinition = { id: 's', title: 'S', submit: { label: 'Send' }, fields: [text('a'), text('a')] };
    expect(() => new FormEngine(definition)).toThrow('already used by /fields/0 on the same path');
  });
});
