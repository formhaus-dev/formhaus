import type { FormDefinition, FormField, FormNode } from '../types';
import type { MessageSource, ValidatorFn } from '../validation';
import { messageResolver, namedResolver, type ResolveMessage } from '../validation/default-messages';
import { parseDefinition } from '../definition-validation';
import { getAllFields } from '../engine/engine-utils';
import type { EngineInternals } from '../engine/runtime-internals';
import { FormEngine } from '../engine/runtime';
import { skipStepAt } from '../engine/step-skip';
import { createVisibility } from '../engine/visibility-state';
import { normalizeValue, typeError } from '../validation/type-checks';
import { hasOwn, isEntry, isGroup, isSection, itemPath } from '../visibility/nodes';

export interface SubmissionOptions {
  skippedSteps?: string[];
  validators?: Record<string, ValidatorFn>;
  messages?: MessageSource;
}

const BODY_MESSAGE = 'Pass the values object as the second argument, not the request body with "values" and "skippedSteps".';

export interface SubmissionResult {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

const allow: ValidatorFn = () => null;

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

interface ActiveValues {
  values: Record<string, unknown>;
  active: Map<string, FormField>;
}

function activeValues(definition: FormDefinition, fields: FormField[], input: unknown): ActiveValues {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const visibility = createVisibility(definition);
  const keys = [...new Set(fields.map(({ key }) => key))].filter((key) => hasOwn(source, key));
  let result: ActiveValues = { values: {}, active: new Map() };
  for (let round = 0; round <= fields.length; round++) {
    const values: Record<string, unknown> = {};
    for (const key of keys) {
      const value = normalizeValue(result.active.get(key) ?? fields.find((field) => field.key === key)!, source[key]);
      if (value !== undefined) values[key] = value;
    }
    const active = new Map<string, FormField>();
    for (const key of keys) {
      const field = visibility.activeField(key, values);
      if (field) active.set(key, field);
    }
    const settled = keys.every((key) => active.get(key) === result.active.get(key));
    result = { values, active };
    if (settled) break;
  }
  return result;
}

function typeErrors({ values, active }: ActiveValues, resolve: ResolveMessage): Map<string, string> {
  const errors = new Map<string, string>();
  for (const [key, field] of active) {
    const error = typeError(field, values[key], resolve);
    if (error) errors.set(key, error);
  }
  return errors;
}

function itemErrors(engine: FormEngine, invalid: Map<string, string>, resolve: ResolveMessage): Map<string, string> {
  const errors = new Map<string, string>();
  for (const group of internals(engine).visibility.groups) {
    if (invalid.has(group.key)) continue;
    engine.items(group.key).forEach(({ fields }, index) => {
      const item = (engine.values[group.key] as unknown[])[index];
      if (!isEntry(item)) return;
      for (const field of fields) {
        const error = typeError(field, item[field.key], resolve);
        if (!error) continue;
        errors.set(itemPath(group.key, index, field.key), error);
        engine.setItemValue(group.key, index, field.key, undefined);
      }
    });
  }
  return errors;
}

function withoutRules(definition: FormDefinition, invalid: Map<string, string>): FormDefinition {
  const strip = (fields: FormNode[]): FormNode[] =>
    fields.map((field) =>
      isSection(field)
        ? { ...field, fields: strip(field.fields) as FormField[] }
        : invalid.has(field.key)
          ? { ...field, validation: undefined }
          : field,
    );
  const steps = definition.steps?.map((step) => ({ ...step, fields: strip(step.fields) }));
  return { ...definition, ...(definition.fields && { fields: strip(definition.fields) }), ...(steps && { steps }) };
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

function rejectGroups(fields: FormField[], input: unknown, resolve: ResolveMessage) {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? { ...(input as Record<string, unknown>) } : {};
  const rejected = new Map<string, string>();
  for (const group of fields.filter(isGroup)) {
    const error = hasOwn(source, group.key) && !rejected.has(group.key) && typeError(group, source[group.key], resolve);
    if (!error) continue;
    rejected.set(group.key, error);
    delete source[group.key];
  }
  return { source, rejected };
}

export function validateSubmission(definition: FormDefinition, values: unknown, options: SubmissionOptions = {}): SubmissionResult {
  parseDefinition(definition);
  const fields = getAllFields(definition);
  const messages = messageResolver(options.messages, definition.messages);
  const { source, rejected } = rejectGroups(fields, values, namedResolver(messages));
  const resolved = activeValues(definition, fields, source);
  const invalid = typeErrors(resolved, namedResolver(messages));
  const engineOptions = { validators: ignoredValidators(fields, options.validators), messages, onWarning: () => {} };
  const engine = new FormEngine(withoutRules(definition, invalid), resolved.values, engineOptions);
  const items = itemErrors(engine, invalid, namedResolver(messages));
  applySkips(engine, options.skippedSteps);
  const errors = engine.validate();
  const submitted: Record<string, unknown> = engine.getSubmitValues();
  const { visibility } = internals(engine);
  for (const [key, error] of invalid) {
    if (!hasOwn(submitted, key)) continue;
    errors[key] = error;
    submitted[key] = resolved.values[key];
    for (const path of Object.keys(errors)) if (path !== key && visibility.owner(path) === key) delete errors[path];
  }
  const skipped = new Set([...internals(engine).skipped.values()].flat());
  for (const [key, error] of rejected) {
    if (!visibility.activeField(key, engine.values) || skipped.has(key)) continue;
    errors[key] = error;
    delete submitted[key];
    for (const path of Object.keys(errors)) if (path !== key && visibility.owner(path) === key) delete errors[path];
  }
  for (const [key, error] of items)
    if (hasOwn(submitted, visibility.owner(key)) && visibility.activeItem(key, engine.values)) errors[key] = error;
  if (isBody(fields, values)) errors.values = BODY_MESSAGE;
  return { values: submitted, errors };
}
