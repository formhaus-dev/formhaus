import { RECALL_SLOTS, recallEnabled, recallKeys, reservedTokens } from '../engine/recall';
import type { FormGroup } from '../types';
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

export function recallWarnings(context: CheckContext): DefinitionIssue[] {
  if (!recallEnabled(context.definition)) return [];
  return recallTexts(context).flatMap(({ path, keys, reserved, step, owner, group }) => [
    ...reserved.map((token) =>
      warning(
        'recall-syntax',
        path,
        `"${token}" holds more than a field key and shows as written`,
        'Put only a field key inside {{ }}, or write \\{{ for literal braces',
      ),
    ),
    ...keys.flatMap((key) => {
      const target = context.target(key, group?.key);
      if (!target) return [warning('unknown-recall-field', path, `"{{${key}}}" names no field`, 'Use the key of an earlier field')];
      return target.field === owner || target.step > step
        ? [
            warning(
              'recall-forward-reference',
              path,
              `"{{${key}}}" recalls a field that is not answered yet`,
              'Recall a field from an earlier step',
            ),
          ]
        : [];
    }),
  ]);
}
