import { SOURCE_NAMES } from '../sources';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, warning } from './issues';
import { isEntry } from './shape';

function sourceIssue({ field, path }: FieldEntry): DefinitionIssue[] {
  const source: unknown = field.source;
  const at = `${path}/source`;
  const names = SOURCE_NAMES as string[];
  if (typeof source === 'string') {
    return names.includes(source) ? [] : [error('unknown-source', at, source, names)];
  }
  const query = isEntry(source) && Object.keys(source).length === 1 ? source.query : undefined;
  return source === undefined || (typeof query === 'string' && query.trim()) ? [] : [error('invalid-type', at, 'source')];
}

export function sourceIssues(context: CheckContext): DefinitionIssue[] {
  return context.entries.flatMap(sourceIssue);
}

export function sourceWarnings({ field, path }: FieldEntry): DefinitionIssue[] {
  return field.source === undefined || field.type === 'hidden'
    ? []
    : [warning('source-not-applicable', `${path}/source`, `only hidden fields read "source"`, 'Set "type" to "hidden" or remove "source"')];
}
