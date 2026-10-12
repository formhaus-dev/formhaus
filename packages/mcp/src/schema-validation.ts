import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import { issue, type Issue } from './issues';
import { CONDITION_OPERATORS, VALIDATION_RULES } from './vocabulary';

let compiled: ValidateFunction | undefined;

const RULES = new Set<string>(VALIDATION_RULES);
const CONDITION_PATH = /\/(show|showAny|disabled)\/\d+$/;

function schemaValidator(): ValidateFunction {
  if (compiled) return compiled;
  const path = createRequire(import.meta.url).resolve('@formhaus/core/schema.json');
  compiled = new Ajv({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(path, 'utf8')));
  return compiled;
}

function hint(instancePath: string, extra: string | undefined): string | undefined {
  if (!extra) return undefined;
  if (CONDITION_PATH.test(instancePath)) return `Use exactly one operator: ${CONDITION_OPERATORS.join(', ')}`;
  if (RULES.has(extra) && /\/fields\/\d+$/.test(instancePath)) return `Move "${extra}" into "validation": { "${extra}": ... }`;
  return `Remove "${extra}"`;
}

function toIssue({ instancePath, message, params }: ErrorObject): Issue {
  const extra = 'additionalProperty' in params ? String(params.additionalProperty) : undefined;
  const missing = 'missingProperty' in params ? String(params.missingProperty) : undefined;
  const problem = `${message ?? 'is invalid'}${extra ? ` "${extra}"` : ''}`;
  const path = extra || missing ? `${instancePath}/${extra ?? missing}` : instancePath;
  return issue('schema', 'error', path, problem, hint(instancePath, extra));
}

export function schemaIssues(definition: unknown): Issue[] {
  const validate = schemaValidator();
  if (validate(definition)) return [];
  const seen = new Set<string>();
  return (validate.errors ?? []).map(toIssue).filter(({ message }) => !seen.has(message) && seen.add(message));
}
