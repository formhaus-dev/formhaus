import { validateDefinition, type FormDefinition, type FormEngine } from '@formhaus/core';
import { parseDefinition } from './definition-input';
import { createEngine } from './engine';
import { schemaErrors } from './schema-validation';
import { checkStructure } from './structure';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Inspection {
  report: ValidationReport;
  definition?: FormDefinition;
  engine?: FormEngine;
}

function finish(errors: string[], warnings: string[]): ValidationReport {
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function bestEffortErrors(definition: FormDefinition): string[] {
  try {
    const { errors } = checkStructure(definition);
    if (errors.length > 0) return errors;
    const engine = createEngine(definition);
    return engine.ok ? [] : engine.errors;
  } catch {
    return [];
  }
}

export function inspectDefinition(input: unknown, values?: Record<string, unknown>): Inspection {
  const parsed = parseDefinition(input);
  if (!parsed.ok) return { report: finish([parsed.error], []) };
  const definition = parsed.value as unknown as FormDefinition;
  const invalid = schemaErrors(parsed.value);
  if (invalid.length > 0) return { report: finish([...invalid, ...bestEffortErrors(definition)], []) };
  const { errors, warnings } = checkStructure(definition);
  if (errors.length > 0) return { report: finish(errors, warnings) };
  const engine = createEngine(definition, values);
  if (!engine.ok) errors.push(...engine.errors);
  warnings.push(...validateDefinition(definition).filter((warning) => !errors.includes(warning)));
  if (!engine.ok) return { report: finish(errors, warnings) };
  return { report: finish(errors, warnings), definition, engine: engine.engine };
}

export function validateDefinitionTool(input: { definition: unknown }): ValidationReport {
  return inspectDefinition(input.definition).report;
}
