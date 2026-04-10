import type { FormField, FormDefinition, ShowCondition } from '../types';

function extractDependencies(conditions?: ShowCondition[]): string[] {
  if (!conditions) return [];
  return conditions.map((c) => c.field);
}

function getAllFields(definition: FormDefinition): FormField[] {
  if ((definition.steps?.length ?? 0) > 0) {
    return definition.steps!.flatMap((s) => s.fields);
  }
  return definition.fields ?? [];
}

function detectCycles(graph: Map<string, string[]>): string[][] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push([...path.slice(cycleStart), node]);
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor, path);
    }

    path.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  return cycles;
}

export function validateDefinition(definition: FormDefinition): string[] {
  const warnings: string[] = [];

  const hasFields = (definition.fields?.length ?? 0) > 0;
  const hasSteps = (definition.steps?.length ?? 0) > 0;

  if (hasFields && hasSteps) {
    warnings.push('Definition has both "fields" and "steps". Only "steps" will be used.');
  }

  const allFields = getAllFields(definition);
  const fieldKeys = new Set<string>();
  const graph = new Map<string, string[]>();

  for (const field of allFields) {
    if (fieldKeys.has(field.key)) {
      warnings.push(`Duplicate field key "${field.key}" — fields will share state and overwrite each other`);
    }
    fieldKeys.add(field.key);
  }

  for (const field of allFields) {
    const deps = [...extractDependencies(field.show), ...extractDependencies(field.showAny)];

    for (const dep of deps) {
      if (!fieldKeys.has(dep)) {
        warnings.push(
          `Field "${field.key}" has show condition referencing non-existent field "${dep}"`,
        );
      }
    }

    if (field.validation?.pattern !== undefined) {
      try {
        new RegExp(field.validation.pattern);
      } catch {
        warnings.push(
          `Field "${field.key}" has invalid regex pattern: "${field.validation.pattern}"`,
        );
      }
    }

    if (deps.length > 0) {
      graph.set(field.key, deps);
    }
  }

  const cycles = detectCycles(graph);
  for (const cycle of cycles) {
    warnings.push(`Circular show condition detected: ${cycle.join(' -> ')}`);
  }

  return warnings;
}
