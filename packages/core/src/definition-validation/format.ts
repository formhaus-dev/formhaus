import type { DefinitionIssue } from './issues';
import { error } from './issues';

export const FORMAT_VERSION = '1.6';

export function formatIssues({ formatVersion: version }: Record<string, unknown>): DefinitionIssue[] {
  if (version === undefined) return [];
  const valid = typeof version === 'string' && /^[1-9]\d*(\.\d+)?$/.test(version);
  if (valid && parseInt(version, 10) <= parseInt(FORMAT_VERSION, 10)) return [];
  return [valid ? error('unsupported-format-version', '/formatVersion', version) : error('invalid-type', '/formatVersion', 'version')];
}
