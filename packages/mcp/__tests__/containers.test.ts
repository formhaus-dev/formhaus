import { describe, expect, it } from 'vitest';
import { capabilitiesTool } from '../src/capabilities';
import { exampleDefinitionsTool } from '../src/examples';
import { simulatePathTool } from '../src/simulate';
import { translationTemplateTool } from '../src/translation';
import { validateDefinitionTool } from '../src/validate';

const registration = () => {
  const result = exampleDefinitionsTool({ id: 'event-registration' });
  if (!('definition' in result)) throw new Error('missing example');
  return structuredClone(result.definition);
};

const summary = (definition: unknown) =>
  validateDefinitionTool({ definition }).issues.map(({ severity, code, path }) => `${severity} ${code} ${path}`);

describe('sections and groups', () => {
  it('lists sections and groups in capabilities', () => {
    const result = capabilitiesTool();
    expect(result.containerTypes).toEqual(['section', 'group']);
    expect(result.groups.rules.join(' ')).toMatch(/group-scope/);
    expect(result.i18n.keys.slots.group).toContain('itemLabel');
    expect(Object.keys(result.i18n.labels.defaults)).toEqual(
      expect.arrayContaining(['addItem', 'removeItem', 'itemLabel', 'itemAdded', 'itemRemoved']),
    );
  });

  it('reports scope and nesting errors with core codes', () => {
    const definition = registration();
    definition.fields!.push({ key: 'summary', type: 'text', label: 'Summary', show: [{ field: 'email', notEmpty: true }] });
    expect(summary(definition)).toEqual(['error group-scope /fields/4/show/0/field']);
    const nested = registration();
    (nested.fields![2] as { fields: unknown[] }).fields.push({ key: 'inner', type: 'section', title: 'Inner', fields: [] });
    expect(summary(nested)).toEqual(['error invalid-nesting /fields/2/fields/3/type']);
    expect(summary({ ...registration(), formatVersion: undefined })).toEqual(['warning outdated-format-version /formatVersion']);
  });

  it('reports schema errors on sections and groups without if/then noise', () => {
    const definition = registration();
    Object.assign(definition.fields![2], { label: 'Billing' });
    Object.assign(definition.fields![3], { placeholder: 'x' });
    expect(summary(definition)).toEqual(['error unknown-property /fields/2/label', 'error unknown-property /fields/3/placeholder']);
  });

  it('warns about autoAdvance inside a group', () => {
    const definition = registration();
    (definition.fields![3] as { fields: unknown[] }).fields.push({
      key: 'pick',
      type: 'radio',
      label: 'Pick',
      autoAdvance: true,
      options: [{ value: 'a', label: 'A' }],
    });
    expect(summary(definition)).toEqual(['warning auto-advance-ignored /fields/3/fields/4/autoAdvance']);
  });

  it('simulates group answers with item paths', async () => {
    const result = await simulatePathTool({
      definition: registration(),
      answers: {
        company: 'Acme',
        invoice: true,
        street: 'Main',
        city: 'Oslo',
        participants: [{ name: 'Ada', email: 'ada@example.com', diet: 'other' }, { name: 'Bo' }],
      },
    });
    expect(result.path?.[0].visibleFields).toEqual(
      [
        'company',
        'invoice',
        'street',
        'city',
        'vatId',
        'participants',
        'participants.0.name',
        'participants.0.email',
        'participants.0.diet',
        'participants.0.dietNote',
        'participants.1.name',
        'participants.1.email',
        'participants.1.diet',
        'participants.1.dietNote',
      ].filter((key) => key !== 'participants.1.dietNote'),
    );
    expect(result.errors).toEqual({
      'participants.0.dietNote': 'This field is required',
      'participants.1.email': 'This field is required',
    });
    expect(result.wouldSubmit).toBe(false);
  });

  it('submits cleaned item objects', async () => {
    const result = await simulatePathTool({
      definition: registration(),
      answers: { company: 'Acme', participants: [{ name: ' Ada ', email: 'ada@example.com', dietNote: 'x', extra: 1 }] },
    });
    expect(result.wouldSubmit).toBe(true);
    expect(result.submitValues).toEqual({ company: 'Acme', participants: [{ name: 'Ada', email: 'ada@example.com', diet: 'none' }] });
  });

  it('builds a translation template with section and group addresses', () => {
    const result = translationTemplateTool({ definition: registration(), lang: 'de' });
    if (!result.ok) throw new Error('invalid');
    expect(result.overlay).toMatchObject({
      sections: { billing: { title: 'Billing address' } },
      fields: { participants: { itemLabel: 'Participant {index}', fields: { name: { label: 'Full name' } } } },
    });
  });
});
