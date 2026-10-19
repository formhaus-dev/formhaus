import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FormField } from '../types';

const safe = (key: string) => key.replace(/[^a-z0-9]/g, (char) => `_${char.codePointAt(0)!.toString(16)}_`);

export function autofilled<T extends FormField>(engine: FormEngine, field: T, path?: string): T {
  const token = typeof field.autocomplete === 'string' ? field.autocomplete.trim() : '';
  const parts = path && token && !/^(on|off)$/i.test(token) ? (engine as unknown as EngineInternals).visibility.parse(path) : undefined;
  if (!parts) return field;
  const section = `section-${safe(String(parts[0]))}-${parts[1]}`;
  return { ...field, autocomplete: token.replace(/^(?:section-)?/i, (own) => (own ? `${section}-` : `${section} `)) };
}
