import type { FormDefinition, FormField, FormStep } from '@formhaus/core';
import { FIELD_TYPES } from './vocabulary';

export interface Findings {
  errors: string[];
  warnings: string[];
}

const KNOWN_TYPES = new Set<string>(FIELD_TYPES);

function checkField(field: FormField, path: string, findings: Findings): void {
  const { type } = field;
  if (!KNOWN_TYPES.has(type)) {
    findings.warnings.push(`${path} uses custom type "${type}"; adapters need a component registered for it.`);
  }
  if (field.autoAdvance && type !== 'radio') {
    findings.warnings.push(`${path} has autoAdvance but only radio fields advance automatically.`);
  }
}

export function advancingRadios(step: FormStep): FormField[] {
  return step.fields.filter((field) => field.type === 'radio' && field.autoAdvance);
}

function checkStep(step: FormStep, path: string, findings: Findings, isLast: boolean): void {
  step.fields.forEach((field, index) => checkField(field, `${path}.fields[${index}]`, findings));
  if (step.next === false && !isLast && advancingRadios(step).length === 0) {
    findings.warnings.push(`${path} has next: false but no autoAdvance radio, so users cannot move forward.`);
  }
}

export function checkStructure(definition: FormDefinition): Findings {
  const findings: Findings = { errors: [], warnings: [] };
  const fields = definition.fields ?? [];
  const steps = definition.steps ?? [];
  if (fields.length > 0 && steps.length > 0) findings.errors.push('Definition cannot have both non-empty "fields" and "steps".');
  if (fields.length === 0 && steps.length === 0) findings.warnings.push('Definition has no fields and no steps.');
  fields.forEach((field, index) => checkField(field, `fields[${index}]`, findings));
  const stepIds = new Set<string>();
  steps.forEach((step, index) => {
    if (stepIds.has(step.id)) findings.errors.push(`Duplicate step id "${step.id}" at steps[${index}].`);
    stepIds.add(step.id);
    checkStep(step, `steps[${index}]`, findings, index === steps.length - 1);
  });
  return findings;
}
