import { describe, expect, it, vi } from 'vitest';
import schema from '../../schema/form-definition.schema.json';
import { checkDefinition, FormEngine, parseDefinition, type FormDefinition } from '../../src';
import { PROPERTIES } from '../../src/definition-validation/properties';

const base = { id: 'a', title: 'A', submit: { label: 'Go' } };
const field = { key: 'x', type: 'text', label: 'X' };

const summary = (input: unknown) => checkDefinition(input).map(({ severity, code, message }) => `${severity} ${code} ${message}`);

describe('property checks', () => {
  it('reports a mistyped form id as a missing id and an unknown property', () => {
    const input = { imd: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'name', type: 'text', label: '' }] };
    expect(checkDefinition(input)).toEqual([
      {
        code: 'missing-property',
        severity: 'error',
        path: '',
        message: '/: missing required property "id".',
      },
      {
        code: 'unknown-property',
        severity: 'warning',
        path: '/imd',
        message: '/imd: unknown property "imd". Did you mean "id"?',
        hint: 'Did you mean "id"?',
      },
      {
        code: 'empty-label',
        severity: 'warning',
        path: '/fields/0/label',
        message: '/fields/0/label: the label of "name" is empty. Add a label so screen readers can name the input.',
        hint: 'Add a label so screen readers can name the input.',
      },
    ]);
  });

  it('reports a submit action that is not an object as a type error', () => {
    expect(checkDefinition({ id: 'a', title: 'A', submit: 'Go' })).toEqual([
      {
        code: 'invalid-type',
        severity: 'error',
        path: '/submit',
        message: '/submit: must be an action object. Add "submit": { "label": "Submit" }.',
        hint: 'Add "submit": { "label": "Submit" }.',
      },
    ]);
  });

  it('reports a numeric id as a type error', () => {
    expect(checkDefinition({ ...base, id: 5 }).map(({ code, path }) => [code, path])).toEqual([['invalid-type', '/id']]);
  });

  it('reports unknown properties at every level', () => {
    const input = {
      ...base,
      colour: 'red',
      submit: { label: 'Go', varient: 'primary' },
      cancel: { label: 'Cancel', action: 'close' },
      steps: [
        {
          id: 's',
          title: 'S',
          subtitle: 'x',
          next: { lable: 'Next' },
          routes: [{ to: null, when: [] }],
          fields: [
            { ...field, Placeholder: 'x', validation: { requird: true } },
            { key: 'c', type: 'select', label: 'C', options: [{ value: 'a', label: 'A', hint: 'x' }] },
          ],
        },
      ],
    };
    expect(summary(input)).toEqual([
      'warning unknown-property /colour: unknown property "colour".',
      'warning unknown-property /submit/varient: unknown property "varient". Did you mean "variant"?',
      'warning unknown-property /cancel/action: unknown property "action".',
      'warning unknown-property /steps/0/subtitle: unknown property "subtitle".',
      'warning unknown-property /steps/0/routes/0/when: unknown property "when".',
      'warning missing-property /steps/0/next: missing required property "label".',
      'warning unknown-property /steps/0/next/lable: unknown property "lable". Did you mean "label"?',
      'warning unknown-property /steps/0/fields/0/Placeholder: unknown property "Placeholder". Did you mean "placeholder"?',
      'warning unknown-property /steps/0/fields/0/validation/requird: unknown property "requird". Did you mean "required"?',
      'warning unknown-property /steps/0/fields/1/options/0/hint: unknown property "hint".',
    ]);
  });

  it('suggests only properties the object does not have', () => {
    expect(summary({ ...base, ids: 'b' })).toEqual(['warning unknown-property /ids: unknown property "ids".']);
  });

  it('points a validation rule on a field to the validation object', () => {
    expect(summary({ ...base, fields: [{ ...field, required: true, minLength: 2 }] })).toEqual([
      'warning unknown-property /fields/0/required: unknown property "required". Move "required" into "validation": { "required": ... }.',
      'warning unknown-property /fields/0/minLength: unknown property "minLength". Move "minLength" into "validation": { "minLength": ... }.',
    ]);
  });

  it('escapes property names in the path', () => {
    expect(checkDefinition({ ...base, 'a/b': 1 })[0].path).toBe('/a~1b');
  });

  it('warns about missing labels and titles the schema requires', () => {
    const input = {
      id: 'a',
      submit: {},
      steps: [
        {
          id: 's',
          fields: [
            { key: 'x', type: 'select', options: [{ value: 'a' }] },
            { key: 'h', type: 'hidden' },
          ],
        },
      ],
    };
    expect(summary(input)).toEqual([
      'warning missing-property /: missing required property "title". Add a title for host UI and editors.',
      'warning missing-property /submit: missing required property "label".',
      'warning missing-property /steps/0: missing required property "title".',
      'warning missing-property /steps/0/fields/0: missing required property "label". Add a label so screen readers can name the input.',
      'warning missing-property /steps/0/fields/0/options/0: missing required property "label".',
      'warning missing-property /steps/0/fields/1: missing required property "label".',
    ]);
  });

  it('warns about a title that is not a string', () => {
    expect(summary({ ...base, title: 5 })).toEqual(['warning invalid-type /title: "title" must be a string.']);
  });

  it('warns about a blank label on a visible field only', () => {
    const fields = [
      { ...field, label: ' ' },
      { key: 'h', type: 'hidden', label: '' },
    ];
    expect(summary({ ...base, fields })).toEqual([
      'warning empty-label /fields/0/label: the label of "x" is empty. Add a label so screen readers can name the input.',
    ]);
  });

  it('keeps unknown properties out of the errors', () => {
    const definition = { ...base, colour: 'red', fields: [{ ...field, tooltip: 'x' }] } as FormDefinition;
    expect(() => parseDefinition(definition)).not.toThrow();
    const onWarning = vi.fn();
    new FormEngine(definition, {}, { onWarning });
    expect(onWarning.mock.calls.map(([issue]) => issue.path)).toEqual(['/colour', '/fields/0/tooltip']);
  });

  it('knows the same properties as the JSON Schema', () => {
    const { definitions } = schema as unknown as { properties: object; definitions: Record<string, { properties: object }> };
    const known = (list: string) => list.split(' ').sort();
    const names = (properties: object) => Object.keys(properties).sort();
    expect(known(PROPERTIES.form)).toEqual(names(schema.properties));
    expect(known(PROPERTIES.step)).toEqual(names(definitions.FormStep.properties));
    expect(known(PROPERTIES.field)).toEqual(names(definitions.FormField.properties));
    expect(known(PROPERTIES.option)).toEqual(names(definitions.FieldOption.properties));
    expect(known(PROPERTIES.action)).toEqual(names(definitions.FormAction.properties));
    expect(known(PROPERTIES.route)).toEqual(names(definitions.StepRoute.properties));
    expect(known(PROPERTIES.validation)).toEqual(names(definitions.FieldValidation.properties));
  });
});
