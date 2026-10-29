import type { FormDefinition } from '../types';
import type { DefinitionIssue } from './issues';
import { error } from './issues';

export const FORMAT_VERSION = '1.7';

export const formatOf = ({ formatVersion }: Pick<FormDefinition, 'formatVersion'>): number[] =>
  String(formatVersion ?? '1.0')
    .split('.')
    .map(Number);

export function formatAtLeast(definition: Pick<FormDefinition, 'formatVersion'>, minor: number): boolean {
  const [major, version = 0] = formatOf(definition);
  return major > 1 || version >= minor;
}

export function formatIssues({ formatVersion: version }: Record<string, unknown>): DefinitionIssue[] {
  if (version === undefined) return [];
  const valid = typeof version === 'string' && /^[1-9]\d*(\.\d+)?$/.test(version);
  if (valid && parseInt(version, 10) <= parseInt(FORMAT_VERSION, 10)) return [];
  return [valid ? error('unsupported-format-version', '/formatVersion', version) : error('invalid-type', '/formatVersion', 'version')];
}
