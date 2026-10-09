import { getAllFields } from '../engine/engine-utils';
import type { FormDefinition, FormField } from '../types';

export interface DefinitionAnalysis {
  graph: Map<string, string[]>;
  warnings: string[];
}

export function analyzeDefinition(definition: FormDefinition): DefinitionAnalysis {
  const warnings: string[] = [];
  const graph = new Map<string, string[]>();
  const fields = getAllFields(definition);
  const fieldKeys = new Set<string>();
  for (const { key } of fields) {
    if (fieldKeys.has(key)) warnings.push(`Duplicate field key "${key}" — fields will share state and overwrite each other`);
    fieldKeys.add(key);
  }
  const depend = (owner: string, id: string, source: Pick<FormField, 'show' | 'showAny'>, keys: string[]) => {
    const dependencies = [...(source.show ?? []), ...(source.showAny ?? [])].map((condition) => condition.field);
    for (const dependency of dependencies) {
      if (!fieldKeys.has(dependency)) warnings.push(`${owner} "${id}" has show condition referencing non-existent field "${dependency}"`);
    }
    if (dependencies.length) for (const key of keys) graph.set(key, [...(graph.get(key) ?? []), ...dependencies]);
  };
  for (const field of fields) {
    depend('Field', field.key, field, [field.key]);
    const pattern = field.validation?.pattern;
    if (pattern === undefined) continue;
    try {
      new RegExp(pattern);
    } catch {
      warnings.push(`Field "${field.key}" has invalid regex pattern: "${pattern}"`);
    }
  }
  for (const step of definition.steps ?? []) {
    depend('Step', step.id, step, step.fields.map((field) => field.key));
    if (step.skip && (step.next === false || !definition.steps![1])) {
      warnings.push(`Step "${step.id}" has "skip" but no Next button or later step.`);
    }
  }
  return { graph, warnings };
}
