import type { FormDefinition, FormField } from '../types';
import type { MessageSource, ValidatorFn } from '../validation';
import { withPatternBudget } from '../validation/validate-field';
import { messageResolver, namedResolver, type ResolveMessage } from '../validation/default-messages';
import { parseDefinition } from '../definition-validation';
import { getAllFields } from '../engine/engine-utils';
import type { EngineInternals } from '../engine/runtime-internals';
import { FormEngine } from '../engine/runtime';
import { skipStepAt } from '../engine/step-skip';
import { createVisibility } from '../engine/visibility-state';
import { trustDefinition } from '../engine/warnings';
import { normalizeValue, typeError } from '../validation/type-checks';
import { hasOwn, isEntry, isGroup, itemPath, keepId } from '../visibility/nodes';

export interface SubmissionOptions {
  skippedSteps?: string[];
  validators?: Record<string, ValidatorFn>;
  messages?: MessageSource;
  hiddenValues?: 'clear' | 'keep';
}

const BODY_MESSAGE = 'Pass the values object as the second argument, not the request body with "values" and "skippedSteps".';

export interface SubmissionResult {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

const allow: ValidatorFn = () => null;
const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

type ActiveValues = { values: Record<string, unknown>; active: Map<string, FormField>; invalid: Map<string, unknown> };

function withoutInvalid(
  item: Record<string, unknown>,
  fields: FormField[],
  resolve: ResolveMessage,
  report: (key: string, error: string) => void,
) {
  const bad = fields.filter((field) => {
    const error = hasOwn(item, field.key) && typeError(field, item[field.key], resolve);
    if (error) report(field.key, error);
    return error;
  });
  if (!bad.length) return item;
  const entry = { ...item };
  for (const field of bad) delete entry[field.key];
  return keepId(item, entry);
}

function activeValues(
  definition: FormDefinition,
  fields: FormField[],
  source: Record<string, unknown>,
  resolve: ResolveMessage,
): ActiveValues {
  const visibility = createVisibility(definition);
  const first = new Map([...fields].reverse().map((field) => [field.key, field]));
  const keys = [...new Set(fields.map(({ key }) => key))].filter((key) => hasOwn(source, key));
  let result: ActiveValues = { values: {}, active: new Map(), invalid: new Map() };
  for (let round = 0; round <= fields.length; round++) {
    const normalized: Record<string, unknown> = {};
    const fieldOf = (key: string) => result.active.get(key) ?? first.get(key)!;
    for (const key of keys) {
      const value = normalizeValue(fieldOf(key), source[key]);
      if (value !== undefined) normalized[key] = value;
    }
    const invalid = new Map<string, unknown>();
    const values = withoutInvalid(normalized, keys.map(fieldOf), resolve, (key) => invalid.set(key, normalized[key]));
    const active = new Map<string, FormField>();
    for (const key of keys) {
      const field = visibility.activeField(key, values);
      if (field) active.set(key, field);
    }
    const settled = keys.every((key) => active.get(key) === result.active.get(key));
    result = { values, active, invalid };
    if (settled) break;
  }
  return result;
}

function blankItems({ values, active }: ActiveValues, fields: FormField[], resolve: ResolveMessage): Map<string, string> {
  const errors = new Map<string, string>();
  for (const group of fields) {
    const { key } = group;
    if (isGroup(group) && (active.get(key) ?? group) === group && Array.isArray(values[key]))
      values[key] = (values[key] as unknown[]).map((item, index) =>
        isEntry(item)
          ? withoutInvalid(item, group.fields, resolve, (field, error) => errors.set(itemPath(key, index, field), error))
          : item,
      );
  }
  return errors;
}

function loadSubmitted(engine: FormEngine, values: Record<string, unknown>): void {
  const { state, visibility } = internals(engine);
  state.values = { ...values };
  visibility.reconcileHidden(state.values, state.errors, true);
  visibility.markChanged(true, true);
  visibility.loadPayload();
}

function setError(visibility: EngineInternals['visibility'], errors: Record<string, string>, key: string, error: string): void {
  errors[key] = error;
  if (visibility.groups.some((group) => group.key === key))
    for (const path of Object.keys(errors)) if (path !== key && visibility.owner(path) === key) delete errors[path];
}

function ignoredValidators(fields: FormField[], given: Record<string, ValidatorFn> = {}): Record<string, ValidatorFn> {
  const validators: Record<string, ValidatorFn> = {};
  for (const { validation } of fields.flatMap((field) => (isGroup(field) ? [field, ...field.fields] : [field])))
    if (validation?.validator) validators[validation.validator] = allow;
  return { ...validators, ...given };
}

function isBody(fields: FormField[], input: unknown): boolean {
  if (input === null || typeof input !== 'object' || !hasOwn(input, 'values')) return false;
  return !fields.some((field) => field.key === 'values' || field.key === 'skippedSteps');
}

function applySkips(engine: FormEngine, skippedSteps: unknown): void {
  if (!Array.isArray(skippedSteps)) return;
  const requested = new Set(skippedSteps);
  for (let index = 0; index < engine.visibleSteps.length; index++) {
    const step = engine.visibleSteps[index];
    if (step.skip && requested.has(step.id)) skipStepAt(engine as unknown as EngineInternals, index);
  }
}

interface Prepared {
  engine: FormEngine;
  skipped: string[];
  check: () => SubmissionResult;
}

function prepare(definition: FormDefinition, fields: FormField[], values: unknown, options: SubmissionOptions): Prepared {
  const messages = messageResolver(options.messages, definition.messages);
  const resolve = namedResolver(messages);
  const resolved = activeValues(definition, fields, isEntry(values) ? values : {}, resolve);
  const items = blankItems(resolved, fields, resolve);
  const engineOptions = { validators: ignoredValidators(fields, options.validators), messages, onWarning: () => {} };
  const engine = new FormEngine(trustDefinition({ ...definition }), resolved.values, engineOptions);
  loadSubmitted(engine, resolved.values);
  applySkips(engine, options.skippedSteps);
  const skipped = [...internals(engine).skipped.values()].flat();
  const check = (): SubmissionResult => {
    const errors = engine.validate();
    const submitted: Record<string, unknown> = engine.getSubmitValues();
    const { visibility, state } = internals(engine);
    for (const [key, value] of resolved.invalid) {
      const field = visibility.activeField(key, state.values);
      if (!field || skipped.includes(key)) continue;
      setError(visibility, errors, key, typeError(field, value, resolve) ?? resolve('value', {}, field));
      delete submitted[key];
    }
    for (const [key, error] of items)
      if (hasOwn(submitted, visibility.owner(key)) && visibility.activeItem(key, state.values)) errors[key] = error;
    if (options.hiddenValues === 'keep') keepHidden(fields, resolved.values, submitted, skipped);
    return { values: submitted, errors };
  };
  return { engine, skipped, check };
}

function keepHidden(fields: FormField[], source: Record<string, unknown>, submitted: Record<string, unknown>, skipped: string[]): void {
  for (const field of fields) {
    const { key } = field;
    const value = source[key];
    if (value === undefined || skipped.includes(key)) continue;
    if (!hasOwn(submitted, key)) submitted[key] = value;
    else if (isGroup(field) && Array.isArray(value) && Array.isArray(submitted[key]))
      submitted[key] = (submitted[key] as unknown[]).map((item, index) =>
        isEntry(item) && isEntry(value[index]) ? { ...value[index], ...item } : item,
      );
  }
}

function withSkipped(source: Record<string, unknown>, { engine, skipped }: Prepared): Record<string, unknown> {
  const { values: current } = internals(engine).state;
  const values = { ...source };
  for (const key of skipped) {
    delete values[key];
    if (current[key] !== undefined) values[key] = current[key];
  }
  return values;
}

export function validateSubmission(definition: FormDefinition, values: unknown, options: SubmissionOptions = {}): SubmissionResult {
  return withPatternBudget(() => validated(definition, values, options));
}

function validated(definition: FormDefinition, values: unknown, options: SubmissionOptions): SubmissionResult {
  parseDefinition(definition);
  const fields = getAllFields(definition);
  const source = isEntry(values) ? values : {};
  let prepared = prepare(definition, fields, source, options);
  for (let round = 0; round < (definition.steps?.length ?? 0) && prepared.skipped.length; round++) {
    const next = prepare(definition, fields, withSkipped(source, prepared), options);
    const settled = next.skipped.join() === prepared.skipped.join();
    prepared = next;
    if (settled) break;
  }
  const result = prepared.check();
  const errors = { ...result.errors };
  if (isBody(fields, values)) errors.values = BODY_MESSAGE;
  return { values: result.values, errors };
}
