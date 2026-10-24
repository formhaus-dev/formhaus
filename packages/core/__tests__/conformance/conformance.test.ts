import { describe, expect, it } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, isActionDisabled, recallText, type FormDefinition } from '../../src';
import { optionOrder } from '../../src/research/option-order';
import { asStored } from '../../src/engine/recall-format';
import { textSlots } from '../../src/i18n';
import { validateSubmission } from '../../src/server';
import { cases, corpus, orders, recalls, runtime } from './corpus';

type Input = (typeof cases)[number][2]['input'];

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byPathAndCode = (a: { code: string; path: string }, b: { code: string; path: string }) =>
  compare(a.path, b.path) || compare(a.code, b.code);
const project = ({ code, path }: { code: string; path: string }) => ({ code, path });

async function browserCanSubmit(definition: FormDefinition, { values, hiddenValues }: Input): Promise<boolean> {
  const engine = new FormEngine(definition, values, { hiddenValues });
  while (engine.isMultiStep && !engine.isLastStep) {
    if (isActionDisabled(engine.currentStep?.next, engine.getSubmitValues()) || !(await engine.next())) return false;
  }
  return Object.keys(engine.validate()).length === 0 && !isActionDisabled(definition.submit, engine.getSubmitValues());
}

describe('conformance corpus', () => {
  it('covers every audited case', () => {
    expect(corpus.map(({ name }) => name).sort()).toEqual([
      'check-autocomplete',
      'check-autocomplete-type',
      'check-autocomplete-version',
      'check-clean',
      'check-columns',
      'check-columns-not-applicable',
      'check-conditions',
      'check-container-conditions',
      'check-container-keys',
      'check-container-nesting',
      'check-container-scope',
      'check-container-shape',
      'check-contains-not-list',
      'check-contains-options',
      'check-custom-type-names',
      'check-default-items',
      'check-disabled-not-applicable',
      'check-escaped-property',
      'check-exclusive',
      'check-field-rules',
      'check-group-item-ceiling',
      'check-group-scope',
      'check-image-urls',
      'check-matrix',
      'check-matrix-options',
      'check-missing-required',
      'check-null-lists',
      'check-numeric-id',
      'check-outdated-version-1-0',
      'check-outdated-version-contains',
      'check-outdated-version-exclusive',
      'check-outdated-version-missing',
      'check-outdated-version-newer',
      'check-outdated-version-randomize',
      'check-randomize',
      'check-randomize-type',
      'check-scale',
      'check-scale-range',
      'check-section-forward-reference',
      'check-slow-pattern',
      'contains-disabled',
      'contains-limit',
      'disabled-actions',
      'duplicate-options',
      'exclusive-options',
      'file-app-reference',
      'flat-api-steps',
      'format-version',
      'group-list-answers',
      'group-over-limit',
      'hidden-values',
      'i18n-empty-overlay',
      'i18n-exclusive-branches',
      'i18n-own-properties',
      'i18n-renderer-labels',
      'i18n-signup-steps',
      'impossible-dates',
      'invalid-labels',
      'invalid-messages',
      'localized-catalog',
      'localized-overlay',
      'option-order',
      'options-from',
      'proto-keys',
      'recall-branches',
      'recall-groups',
      'recall-inactive',
      'recall-limit',
      'recall-no-reexpansion',
      'recall-sensitive',
      'recall-steps',
      'recall-syntax',
      'recall-translations',
      'recall-values',
      'recall-version',
      'shared-key-branches',
      'slow-pattern-quadratic',
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

  it.each(corpus.filter(({ texts }) => texts).map((fixture) => [fixture.name, fixture] as const))('%s: texts', (_, fixture) => {
    const slots = new Map(textSlots(runtime(fixture)).map(({ address, text }) => [address, text]));
    expect(Object.fromEntries(Object.keys(fixture.texts!).map((address) => [address, slots.get(address) ?? null]))).toEqual(fixture.texts);
  });

  it.each(corpus.filter(({ issues }) => issues.length).map((fixture) => [fixture.name, fixture] as const))(
    '%s: rejected by the engine and the server',
    (_, { definition }) => {
      expect(() => new FormEngine(definition)).toThrow(FormDefinitionError);
      expect(() => validateSubmission(definition, {})).toThrow(FormDefinitionError);
    },
  );

  it('lists the patterns the server refuses wherever slow patterns are reported', () => {
    const slow = corpus.filter(({ warnings }) => warnings?.some(({ code }) => code === 'slow-pattern'));
    expect(slow.filter(({ refused }) => !refused).map(({ name }) => name)).toEqual([]);
  });

  it.each(corpus.filter(({ refused }) => refused).map((fixture) => [fixture.name, fixture] as const))(
    '%s: slow patterns refused by the server',
    (_, { definition, refused }) => {
      let issues: { code: string; path: string }[] = [];
      try {
        validateSubmission(definition, {});
      } catch (error) {
        if (error instanceof FormDefinitionError) issues = error.issues.map(project);
      }
      expect(issues.sort(byPathAndCode)).toEqual([...refused!].sort(byPathAndCode));
    },
  );

  it.each(recalls)('%s: recall', (_, definition, { values, texts }) => {
    const slots = new Map(textSlots(definition).map(({ address, text }) => [address, text]));
    const engine = new FormEngine(definition, values, { onWarning: () => {} });
    const submitted = engine.getSubmitValues();
    const resolve = ({ address, group, item }: (typeof texts)[number]) =>
      recallText(definition, slots.get(address)!, submitted, {
        item: group === undefined ? undefined : { group, index: item! },
        format: asStored,
        engine,
      });
    expect(texts.map((entry) => ({ ...entry, text: resolve(entry) }))).toEqual(texts);
  });

  it.each(orders)('%s: option order', (_, { seed, key, count, pinned, order }) => {
    expect(
      optionOrder(
        seed,
        key,
        Array.from({ length: count }, (_, index) => pinned.includes(index)),
      ),
    ).toEqual(order);
  });

  it.each(cases)('%s: server', (_, definition, { input, expected, serverValues, serverErrors }) => {
    const result = validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps, hiddenValues: input.hiddenValues });
    expect(result).toEqual({ values: serverValues ?? expected.values, errors: serverErrors ?? expected.errors });
    expect(Object.getPrototypeOf(result.values)).toBe(Object.prototype);
  });

  it.each(cases)('%s: browser engine', async (_, definition, { input, expected, canSubmit }) => {
    const engine = new FormEngine(definition, input.values, { hiddenValues: input.hiddenValues });
    expect(Object.getPrototypeOf(engine.values)).toBe(Object.prototype);
    expect(engine.validate()).toEqual(expected.errors);
    expect(engine.getSubmitValues()).toEqual(expected.values);
    expect(await browserCanSubmit(definition, input)).toBe(canSubmit);
  });

  it.each(cases)('%s: a payload the browser accepts passes the server', async (_, definition, { input, serverErrors }) => {
    if (serverErrors || !(await browserCanSubmit(definition, input))) return;
    expect(
      validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps, hiddenValues: input.hiddenValues }).errors,
    ).toEqual({});
  });
});
