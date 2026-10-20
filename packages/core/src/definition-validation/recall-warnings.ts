import { RECALL_SLOTS, recallEnabled, recallKeys, reservedTokens } from '../engine/recall';
import type { FormField, FormGroup } from '../types';
import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';

export interface RecallText {
  path: string;
  keys: string[];
  reserved: string[];
  step: number;
  owner?: unknown;
  group?: FormGroup;
}

export function recallTexts({ definition, nodes }: CheckContext): RecallText[] {
  const owners = [
    ...(definition.steps ?? []).map((step, index) => ({ node: step as object, path: `/steps/${index}`, step: index, group: undefined })),
    ...nodes,
  ];
  return owners.flatMap(({ node, path, step, group }) =>
    RECALL_SLOTS.flatMap((slot) => {
      const text = (node as Record<string, unknown>)[slot];
      if (typeof text !== 'string') return [];
      const [keys, reserved] = [recallKeys(text), reservedTokens(text)];
      const scope = slot === 'itemLabel' ? (node as FormGroup) : group;
      return keys.length || reserved.length ? [{ path: `${path}/${slot}`, keys, reserved, step, owner: node, group: scope }] : [];
    }),
  );
}

function keyWarnings(
  context: CheckContext,
  shared: Map<string, FormField[]>,
  { path, keys, step, owner, group }: RecallText,
): DefinitionIssue[] {
  return [...new Set(keys)].flatMap((key) => {
    const token = `"{{${key}}}"`;
    const target = context.target(key, group?.key);
    if (!target) return [warning('unknown-recall-field', path, `${token} names no field`, 'Use the key of an earlier field')];
    const { field } = target;
    const fields = shared.get(`${target.group?.key ?? ''}\n${key}`)!;
    return [
      ...(field === owner || target.step > step
        ? [
            warning(
              'recall-forward-reference',
              path,
              `${token} recalls a field that is not answered yet`,
              'Recall a field from an earlier step',
            ),
          ]
        : []),
      ...(fields.some(({ type }) => type === 'password')
        ? [warning('recall-sensitive-field', path, `${token} recalls a password, which shows nothing`, 'Remove the token')]
        : []),
      ...(fields.some(({ type, source }) => type === 'hidden' && typeof source === 'object' && source !== null)
        ? [
            warning(
              'recall-query-source',
              path,
              `${token} shows text from the page URL, which anyone can write in a link`,
              'Recall it only where any text is safe to show',
            ),
          ]
        : []),
      ...(fields.some(({ type, source }) => type === 'hidden' && (source === 'referrer' || source === 'pageTitle'))
        ? [
            warning(
              'recall-untrusted-source',
              path,
              `${token} shows the referring page or the page title, which another site can set`,
              'Recall it only where any text is safe to show',
            ),
          ]
        : []),
    ];
  });
}

export function recallWarnings(context: CheckContext): DefinitionIssue[] {
  if (!recallEnabled(context.definition)) return [];
  const shared = new Map<string, FormField[]>();
  for (const { field, group } of context.entries) {
    const at = `${group?.key ?? ''}\n${field.key}`;
    shared.get(at)?.push(field) ?? shared.set(at, [field]);
  }
  return recallTexts(context).flatMap((text) => {
    const issues = [
      ...text.reserved
        .slice(0, 1)
        .map((token) =>
          warning(
            'recall-syntax',
            text.path,
            `"${token}" holds more than a field key and shows as written`,
            'Put only a field key inside {{ }}, or write \\{{ for literal braces',
          ),
        ),
      ...keyWarnings(context, shared, text),
    ];
    const codes = new Set<string>();
    return issues.filter(({ code }) => !codes.has(code) && Boolean(codes.add(code)));
  });
}
