import { SOURCE_NAMES } from '../sources';
import type { CheckContext, FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { error, oneOf, warning } from './issues';
import { isEntry } from './shape';

const QUERY = 'Use { "query": "<parameter name>" } for a URL parameter';

function sourceIssue(context: CheckContext, { field, path }: FieldEntry): DefinitionIssue[] {
  const source: unknown = field.source;
  const at = `${path}/source`;
  const names = SOURCE_NAMES as string[];
  if (typeof source === 'string') {
    return names.includes(source)
      ? []
      : [
          error(
            'unknown-source',
            at,
            `"${source}" is not a source`,
            source === 'query' ? QUERY : (context.suggest(source, names) ?? oneOf(names)),
          ),
        ];
  }
  const query = isEntry(source) && Object.keys(source).length === 1 ? source.query : undefined;
  return source === undefined || (typeof query === 'string' && query.trim())
    ? []
    : [error('invalid-type', at, 'must be a source name or a query object', QUERY)];
}

export function sourceIssues(context: CheckContext): DefinitionIssue[] {
  return context.entries.flatMap((entry) => sourceIssue(context, entry));
}

export function sourceWarnings({ field, path }: FieldEntry): DefinitionIssue[] {
  return field.source === undefined || field.type === 'hidden'
    ? []
    : [warning('source-not-applicable', `${path}/source`, `only hidden fields read "source"`, 'Set "type" to "hidden" or remove "source"')];
}
