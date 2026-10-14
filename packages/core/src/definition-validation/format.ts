import type { DefinitionIssue } from './issues';
import { error } from './issues';

export const FORMAT_VERSION = '1.0';

export function formatIssues({ formatVersion: version }: Record<string, unknown>): DefinitionIssue[] {
  if (version === undefined) return [];
  const valid = typeof version === 'string' && /^[1-9]\d*(\.\d+)?$/.test(version);
  if (valid && parseInt(version) <= parseInt(FORMAT_VERSION)) return [];
  return [valid
    ? error('unsupported-format-version', '/formatVersion', `format ${version} is not supported`, 'Upgrade @formhaus/core')
    : error('invalid-type', '/formatVersion', 'must be a version string', `Use "${FORMAT_VERSION}"`)];
}
