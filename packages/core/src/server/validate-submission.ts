import type { FormDefinition, FormField } from '../types';
import type { MessageSource, ValidatorFn } from '../validation';
import { messageResolver, type ResolveMessage } from '../validation/default-messages';
import { parseDefinition } from '../definition-validation';
import { getAllFields } from '../engine/engine-utils';
import type { EngineInternals } from '../engine/runtime-internals';
import { FormEngine } from '../engine/runtime';
import { skipStepAt } from '../engine/step-skip';
import { createVisibility } from '../engine/visibility-state';
import { normalizeValue, typeError } from '../validation/type-checks';

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

const hasOwn = (source: object, key: string) => Object.prototype.hasOwnProperty.call(source, key);

interface ActiveValues {
  values: Record<string, unknown>;
  active: Map<string, FormField>;
}

function activeValues(definition: FormDefinition, fields: FormField[], input: unknown): ActiveValues {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const visibility = createVisibility(definition);
  const keys = [...new Set(fields.map(({ key }) => key))].filter((key) => hasOwn(source, key));
  let result: ActiveValues = { values: {}, active: new Map() };
  for (let round = 0; round <= fields.length; round++) {
    const values: Record<string, unknown> = {};
    for (const key of keys) values[key] = normalizeValue(result.active.get(key) ?? fields.find((field) => field.key === key)!, source[key]);
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

function withoutRules(definition: FormDefinition, invalid: Map<string, string>): FormDefinition {
  const strip = (fields: FormField[]) => fields.map((field) => (invalid.has(field.key) ? { ...field, validation: undefined } : field));
  const steps = definition.steps?.map((step) => ({ ...step, fields: strip(step.fields) }));
  return { ...definition, ...(definition.fields && { fields: strip(definition.fields) }), ...(steps && { steps }) };
}

function ignoredValidators(fields: FormField[], given: Record<string, ValidatorFn> = {}): Record<string, ValidatorFn> {
  const validators: Record<string, ValidatorFn> = {};
  for (const { validation } of fields) if (validation?.validator) validators[validation.validator] = allow;
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

export function validateSubmission(
  definition: FormDefinition,
  values: unknown,
  options: SubmissionOptions = {},
): SubmissionResult {
  parseDefinition(definition);
  const fields = getAllFields(definition);
  const resolved = activeValues(definition, fields, values);
  const messages = messageResolver(options.messages, definition.messages);
  const invalid = typeErrors(resolved, messages);
  const engineOptions = { validators: ignoredValidators(fields, options.validators), messages, onWarning: () => {} };
  const engine = new FormEngine(withoutRules(definition, invalid), resolved.values, engineOptions);
  applySkips(engine, options.skippedSteps);
  const errors = engine.validate();
  const submitted = engine.getSubmitValues();
  for (const [key, error] of invalid) if (hasOwn(submitted, key)) errors[key] = error;
  if (isBody(fields, values)) errors.values = BODY_MESSAGE;
  return { values: submitted, errors };
}
