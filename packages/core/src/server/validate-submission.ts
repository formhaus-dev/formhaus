import type { FormDefinition, FormField } from '../types';
import type { ValidatorFn } from '../validation';
import { getAllFields } from '../engine/engine-utils';
import type { EngineInternals } from '../engine/runtime-internals';
import { FormEngine } from '../engine/runtime';
import { skipStepAt } from '../engine/step-skip';
import { normalizeValue, typeError } from './type-checks';

export interface SubmissionOptions {
  skippedSteps?: string[];
}

export interface SubmissionResult {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

const allow: ValidatorFn = () => null;

const hasOwn = (source: object, key: string) => Object.prototype.hasOwnProperty.call(source, key);

function knownValues(fields: FormField[], input: unknown): Record<string, unknown> {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (hasOwn(source, field.key)) values[field.key] = normalizeValue(field, source[field.key]);
  }
  return values;
}

function typeErrors(fields: FormField[], values: Record<string, unknown>): Map<string, string> {
  const errors = new Map<string, string>();
  for (const field of fields) {
    const error = hasOwn(values, field.key) ? typeError(field, values[field.key]) : null;
    if (error) errors.set(field.key, error);
  }
  return errors;
}

function withoutRules(definition: FormDefinition, invalid: Map<string, string>): FormDefinition {
  const strip = (fields: FormField[]) => fields.map((field) => (invalid.has(field.key) ? { ...field, validation: undefined } : field));
  const steps = definition.steps?.map((step) => ({ ...step, fields: strip(step.fields) }));
  return { ...definition, ...(definition.fields && { fields: strip(definition.fields) }), ...(steps && { steps }) };
}

function ignoredValidators(fields: FormField[]): Record<string, ValidatorFn> {
  const validators: Record<string, ValidatorFn> = {};
  for (const { validation } of fields) if (validation?.validator) validators[validation.validator] = allow;
  return validators;
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
  input: unknown,
  options: SubmissionOptions = {},
): SubmissionResult {
  const fields = getAllFields(definition);
  const initialValues = knownValues(fields, input);
  const invalid = typeErrors(fields, initialValues);
  const engine = new FormEngine(withoutRules(definition, invalid), initialValues, { validators: ignoredValidators(fields) });
  applySkips(engine, options.skippedSteps);
  const errors = engine.validate();
  const values = engine.getSubmitValues();
  for (const [key, error] of invalid) if (hasOwn(values, key)) errors[key] = error;
  return { values, errors };
}
