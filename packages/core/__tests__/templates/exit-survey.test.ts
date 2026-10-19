import { describe, expect, it } from 'vitest';
import template from '../../../../templates/exit-survey.json';
import type { FormDefinition } from '../../src';
import { validateSubmission } from '../../src/server';

describe('exit-survey', () => {
  it('accepts an empty submission and an empty follow-up to "Something else"', () => {
    const definition = template.definition as FormDefinition;
    expect(validateSubmission(definition, {}).errors).toEqual({});
    expect(validateSubmission(definition, { mainReason: 'other', mainOther: '' }).errors).toEqual({});
  });
});
