const clean = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, '-');

export function fieldDomId(formId: string | undefined, key: string): string {
  return `${formId ? clean(formId) : 'fh'}-${clean(key)}`;
}
