const key = '__formhausModules';

export function modules(): Record<string, unknown> {
  const scope = globalThis as unknown as Record<string, Record<string, unknown> | undefined>;
  scope[key] ??= {};
  return scope[key];
}
