import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';

let compiled: ValidateFunction | undefined;

function schemaValidator(): ValidateFunction {
  if (compiled) return compiled;
  const path = createRequire(import.meta.url).resolve('@formhaus/core/schema.json');
  compiled = new Ajv({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(path, 'utf8')));
  return compiled;
}

function formatError({ instancePath, message, params }: ErrorObject): string {
  const extra = 'additionalProperty' in params ? ` "${params.additionalProperty}"` : '';
  return `Schema: ${instancePath || '/'} ${message ?? 'is invalid'}${extra}`;
}

export function schemaErrors(definition: unknown): string[] {
  const validate = schemaValidator();
  if (validate(definition)) return [];
  return [...new Set((validate.errors ?? []).map(formatError))];
}
