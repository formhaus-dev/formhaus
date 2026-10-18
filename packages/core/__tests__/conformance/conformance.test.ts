import { describe, expect, it } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, isActionDisabled, type FormDefinition } from '../../src';
import { validateSubmission } from '../../src/server';
import { cases, corpus } from './corpus';

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byPathAndCode = (a: { code: string; path: string }, b: { code: string; path: string }) =>
  compare(a.path, b.path) || compare(a.code, b.code);
const project = ({ code, path }: { code: string; path: string }) => ({ code, path });

async function browserCanSubmit(definition: FormDefinition, values: Record<string, unknown>): Promise<boolean> {
  const engine = new FormEngine(definition, values);
  while (engine.isMultiStep && !engine.isLastStep) {
    if (isActionDisabled(engine.currentStep?.next, engine.getSubmitValues()) || !(await engine.next())) return false;
  }
  return Object.keys(engine.validate()).length === 0 && !isActionDisabled(definition.submit, engine.getSubmitValues());
}

describe('conformance corpus', () => {
  it('covers every audited case', () => {
    expect(corpus.map(({ name }) => name).sort()).toEqual([
      'check-clean',
      'check-conditions',
      'check-container-conditions',
      'check-container-keys',
      'check-container-nesting',
      'check-container-scope',
      'check-container-shape',
      'check-custom-type-names',
      'check-disabled-not-applicable',
      'check-escaped-property',
      'check-field-rules',
      'check-group-scope',
      'check-missing-required',
      'check-null-lists',
      'check-numeric-id',
      'check-outdated-version-1-0',
      'check-outdated-version-missing',
      'check-outdated-version-newer',
      'check-section-forward-reference',
      'check-slow-pattern',
      'disabled-actions',
      'flat-api-steps',
      'format-version',
      'impossible-dates',
      'invalid-labels',
      'invalid-messages',
      'localized-catalog',
      'localized-overlay',
      'options-from',
      'proto-keys',
      'shared-key-branches',
      'times-and-hidden',
      'trimmed-conditions',
      'trimmed-text',
      'unsupported-format-version',
    ]);
  });

  it.each(corpus.map((fixture) => [fixture.name, fixture] as const))('%s: checkDefinition', (_, { definition, issues }) => {
    const errors = checkDefinition(definition)
      .filter(({ severity }) => severity === 'error')
      .map(project);
    expect(errors.sort(byPathAndCode)).toEqual([...issues].sort(byPathAndCode));
  });

  it.each(corpus.filter(({ warnings }) => warnings).map((fixture) => [fixture.name, fixture] as const))(
    '%s: warnings',
    (_, { definition, warnings }) => {
      const actual = checkDefinition(definition)
        .filter(({ severity }) => severity === 'warning')
        .map(project);
      expect(actual.sort(byPathAndCode)).toEqual([...warnings!].sort(byPathAndCode));
    },
  );

  it.each(corpus.filter(({ issues }) => issues.length).map((fixture) => [fixture.name, fixture] as const))(
    '%s: rejected by the engine and the server',
    (_, { definition }) => {
      expect(() => new FormEngine(definition)).toThrow(FormDefinitionError);
      expect(() => validateSubmission(definition, {})).toThrow(FormDefinitionError);
    },
  );

  it.each(cases)('%s: server', (_, definition, { input, expected }) => {
    const result = validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps });
    expect(result).toEqual(expected);
    expect(Object.getPrototypeOf(result.values)).toBe(Object.prototype);
  });

  it.each(cases)('%s: browser engine', async (_, definition, { input, expected, canSubmit }) => {
    const engine = new FormEngine(definition, input.values);
    expect(Object.getPrototypeOf(engine.values)).toBe(Object.prototype);
    expect(engine.validate()).toEqual(expected.errors);
    expect(engine.getSubmitValues()).toEqual(expected.values);
    expect(await browserCanSubmit(definition, input.values)).toBe(canSubmit);
  });

  it.each(cases)('%s: a payload the browser accepts passes the server', async (_, definition, { input }) => {
    if (!(await browserCanSubmit(definition, input.values))) return;
    expect(validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps }).errors).toEqual({});
  });
});
