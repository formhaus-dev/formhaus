function isFieldValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.every((item) => typeof item === 'string');
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function parseValues(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return Object.values(body).every(isFieldValue) ? (body as Record<string, unknown>) : null;
}
