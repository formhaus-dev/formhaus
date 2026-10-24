import type { ValidateContext } from '@formhaus/core';
import { type StandardSchemaV1, schemaValidate } from '@formhaus/core/schema';

export type Validate = (values: Record<string, unknown>, context: ValidateContext) => unknown;

export interface Problem {
  message: string;
  line?: number;
}

export type Request =
  | { type: 'run'; code: string }
  | { type: 'validate'; id: number; values: Record<string, unknown>; context: ValidateContext };

export type Reply =
  | { type: 'loaded'; problem?: Problem }
  | { type: 'result'; id: number; errors?: Record<string, string>; problem?: Problem };

const header = 2;

export function problemOf(error: unknown): Problem {
  if (!(error instanceof Error)) return { message: String(error) };
  const message = error.name && error.name !== 'Error' ? `${error.name}: ${error.message}` : error.message;
  const at = /schema\.ts:(\d+)/.exec(error.stack ?? '')?.[1];
  const { line, sourceURL } = error as Error & { line?: unknown; sourceURL?: unknown };
  const found = at ? Number(at) : typeof line === 'number' && !sourceURL ? line : undefined;
  return found ? { message, line: found - header } : { message };
}

const isSchema = (value: unknown): value is StandardSchemaV1 => value != null && '~standard' in Object(value);

export function load(code: string, modules: Record<string, unknown>): Validate {
  const require = (name: string) => {
    if (name in modules) return modules[name];
    throw new Error(`Cannot find module '${name}'`);
  };
  const module = { exports: {} as Record<string, unknown> };
  new Function('require', 'exports', 'module', `${code}\n//# sourceURL=schema.ts`)(require, module.exports, module);
  const { onValidate, schema, options } = module.exports;
  if (typeof onValidate === 'function') return onValidate as Validate;
  if (isSchema(schema)) return schemaValidate(schema, options as Parameters<typeof schemaValidate>[1]);
  throw new Error('Export onValidate, or a Standard Schema as schema');
}

export function errorsOf(result: unknown): Record<string, string> {
  if (!result || typeof result !== 'object') return {};
  return Object.fromEntries(Object.entries(result).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

const taken = 'taken@example.com';

export async function demoFetch(input: RequestInfo | URL): Promise<Response> {
  const email = /^\/api\/emails\/([^/?#]+)$/.exec(String(input))?.[1];
  if (!email) throw new TypeError('The playground has no network. Only /api/emails/:email answers.');
  await new Promise((resolve) => setTimeout(resolve, 300));
  return new Response(null, { status: decodeURIComponent(email).toLowerCase() === taken ? 200 : 404 });
}
