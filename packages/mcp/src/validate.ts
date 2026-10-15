import { checkDefinition, type FormDefinition, type FormEngine } from '@formhaus/core';
import { checkTranslations } from '@formhaus/core/i18n';
import { parseDefinition } from './definition-input';
import { createEngine } from './engine';
import { fromCore, issue, ordered, type Issue } from './issues';
import { schemaIssues } from './schema-validation';
import { structureIssues } from './structure';

export interface ValidationReport {
  valid: boolean;
  issues: Issue[];
}

export interface Inspection {
  report: ValidationReport;
  definition?: FormDefinition;
  engine?: FormEngine;
}

function same(schema: Issue, core: Issue): boolean {
  return schema.path === core.path && (schema.code !== 'missing-property' || core.message.startsWith(schema.message));
}

function titleIssue({ path, message }: Issue): boolean {
  return path === '/title' || message === '/: missing required property "title".';
}

function finish(issues: Issue[]): ValidationReport {
  const list = ordered(issues);
  return { valid: !list.some(({ severity }) => severity === 'error'), issues: list };
}

export function inspectDefinition(input: unknown, values?: Record<string, unknown>): Inspection {
  const parsed = parseDefinition(input);
  if (!parsed.ok) return { report: finish([issue('invalid-json', 'error', '', parsed.error.replace(/\.$/, ''))]) };
  const definition = parsed.value as unknown as FormDefinition;
  const checked = checkDefinition(definition, { validators: {} });
  const found = schemaIssues(parsed.value);
  const core = fromCore(
    checked.some(({ severity }) => severity === 'error') ? checked : [...checked, ...checkTranslations(definition)],
  ).map((item): Issue => (found.some((schema) => same(schema, item) && !titleIssue(schema)) ? { ...item, severity: 'error' } : item));
  const nested = core.filter(({ code }) => code === 'invalid-nesting').map(({ path }) => path.replace(/\/type$/, ''));
  const schema = found.filter(
    (item) => !core.some((other) => same(item, other)) && !nested.some((node) => item.path === node || item.path.startsWith(`${node}/`)),
  );
  const report = finish([...schema, ...core, ...(schema.length ? [] : structureIssues(definition))]);
  if (!report.valid) return { report };
  const engine = createEngine(definition, values);
  if (!engine.ok) return { report: finish([...report.issues, ...fromCore(engine.issues)]) };
  return { report, definition, engine: engine.engine };
}

export function validateDefinitionTool(input: { definition: unknown }): ValidationReport {
  return inspectDefinition(input.definition).report;
}
