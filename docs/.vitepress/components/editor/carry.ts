import type { FormDefinition } from '@formhaus/core';

export const CARRY_KEY = 'fh:build:carry';

export function takeCarried(): FormDefinition | null {
  try {
    const text = sessionStorage.getItem(CARRY_KEY);
    sessionStorage.removeItem(CARRY_KEY);
    const parsed: unknown = JSON.parse(text ?? 'null');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as FormDefinition) : null;
  } catch {
    return null;
  }
}
