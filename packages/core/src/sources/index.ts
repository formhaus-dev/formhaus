import { getAllFields } from '../engine/engine-utils';
import type { FieldSourceName, FormDefinition, FormField } from '../types';
import { MAX_HIDDEN_LENGTH, MAX_STRING_LENGTH } from '../validation/type-checks';
import { hasOwn } from '../visibility/nodes';

export const SOURCE_NAMES: readonly FieldSourceName[] = ['referrer', 'page', 'pageTitle', 'language', 'timezone', 'device', 'country'];

export type SourceContext = Partial<Record<Exclude<FieldSourceName, 'page'> | 'search' | 'href', string>>;

function read({ source }: FormField, context: SourceContext): unknown {
  if (typeof source === 'object' && source !== null) {
    return typeof source.query === 'string' ? new URLSearchParams(context.search ?? '').get(source.query) : undefined;
  }
  if (source === 'page' || source === 'referrer') {
    const url = new URL((source === 'page' ? context.href : context.referrer) ?? '');
    return url.origin === 'null' ? undefined : url.origin + url.pathname;
  }
  return source !== undefined && SOURCE_NAMES.includes(source) ? context[source] : undefined;
}

function attempt(field: FormField, context: SourceContext): string | undefined {
  let value: unknown;
  try {
    value = read(field, context);
  } catch {
    return undefined;
  }
  if (typeof value !== 'string') return undefined;
  const limit = field.validation?.maxLength;
  const max = typeof limit === 'number' && limit > 0 ? Math.min(limit, MAX_STRING_LENGTH) : MAX_HIDDEN_LENGTH;
  return value.trim().slice(0, max).trim() || undefined;
}

export function resolveSources(
  definition: FormDefinition,
  context: SourceContext,
  initialValues?: Record<string, unknown>,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of getAllFields(definition)) {
    const { key } = field;
    if (field.type !== 'hidden' || field.source === undefined || (initialValues?.[key] ?? '') !== '' || hasOwn(values, key)) continue;
    const value = attempt(field, context);
    if (value !== undefined) values[key] = value;
  }
  return values;
}
