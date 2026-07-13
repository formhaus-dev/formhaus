import type { FormDefinition, FormField, ShowCondition } from '../types';

export interface DefinitionAnalysis {
  graph: Map<string, string[]>;
  warnings: string[];
}

export function analyzeDefinition(definition: FormDefinition): DefinitionAnalysis {
  const warnings: string[] = [];
  const fields = getAllFields(definition);
  const fieldKeys = collectFieldKeys(fields, warnings);
  const graph = new Map<string, string[]>();
  for (const field of fields) analyzeField(field, fieldKeys, graph, warnings);
  for (const step of definition.steps ?? []) {
    const dependencies = getDependencies(step.show, step.showAny);
    addMissingWarnings('Step', step.id, dependencies, fieldKeys, warnings);
    for (const field of step.fields) addDependencies(graph, field.key, dependencies);
  }
  return { graph, warnings };
}

function getAllFields(definition: FormDefinition): FormField[] {
  return (definition.steps?.length ?? 0) > 0
    ? (definition.steps ?? []).flatMap((step) => step.fields)
    : definition.fields ?? [];
}

function collectFieldKeys(fields: FormField[], warnings: string[]): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    if (keys.has(field.key)) {
      warnings.push(`Duplicate field key "${field.key}" — fields will share state and overwrite each other`);
    }
    keys.add(field.key);
  }
  return keys;
}

function analyzeField(
  field: FormField,
  fieldKeys: Set<string>,
  graph: Map<string, string[]>,
  warnings: string[],
): void {
  const dependencies = getDependencies(field.show, field.showAny);
  addMissingWarnings('Field', field.key, dependencies, fieldKeys, warnings);
  addPatternWarning(field, warnings);
  addDependencies(graph, field.key, dependencies);
}

function getDependencies(show?: ShowCondition[], showAny?: ShowCondition[]): string[] {
  return [...(show ?? []), ...(showAny ?? [])].map((condition) => condition.field);
}

function addMissingWarnings(
  owner: 'Field' | 'Step',
  key: string,
  dependencies: string[],
  fieldKeys: Set<string>,
  warnings: string[],
): void {
  for (const dependency of dependencies) {
    if (!fieldKeys.has(dependency)) {
      warnings.push(`${owner} "${key}" has show condition referencing non-existent field "${dependency}"`);
    }
  }
}

function addPatternWarning(field: FormField, warnings: string[]): void {
  const pattern = field.validation?.pattern;
  if (pattern === undefined) return;
  try {
    new RegExp(pattern);
  } catch {
    warnings.push(`Field "${field.key}" has invalid regex pattern: "${pattern}"`);
  }
}

function addDependencies(
  graph: Map<string, string[]>,
  key: string,
  dependencies: string[],
): void {
  if (dependencies.length === 0) return;
  graph.set(key, [...(graph.get(key) ?? []), ...dependencies]);
}
