import { DEFAULT_MESSAGES } from '../validation/default-messages';
import { DEFAULT_LABELS, hasRule, SLOTS } from './nodes';
import type { CheckContext } from '../definition-validation/context';
import type { DefinitionIssue, DefinitionIssueCode } from '../definition-validation/issues';
import { oneOf, pointer, warning } from '../definition-validation/issues';

type Node = Record<string, unknown> | undefined | false;

export function i18nWarnings({ definition, entries, nodes }: CheckContext): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const ids: [string, unknown][] = [];
  let keyed = false;
  const unknown = (block: unknown, path: string, known: string[], code: DefinitionIssueCode, what: string) => {
    for (const key of Object.keys(block ?? {})) {
      if (!known.includes(key))
        issues.push(warning(code, `${path}/${pointer(key)}`, `"${key}" is not ${what}`, known.length ? oneOf(known) : 'Remove it'));
    }
  };
  const node = (value: Node, path: string, slots: readonly string[], id?: string) => {
    if (!value) return;
    if (id) ids.push([`${path}/${id}`, value[id]]);
    if (!value.i18n) return;
    keyed = true;
    unknown(value.i18n, `${path}/i18n`, [...slots], 'unknown-i18n-slot', 'a translatable text here');
  };
  const messages = Object.keys(DEFAULT_MESSAGES);
  const labels = Object.keys(DEFAULT_LABELS);
  unknown(definition.messages, '/messages', messages, 'unknown-message-key', 'a message key');
  unknown(definition.labels, '/labels', labels, 'unknown-label-key', 'a label key');
  unknown(definition.i18n?.messages, '/i18n/messages', messages, 'unknown-message-key', 'a message key');
  unknown(definition.i18n?.labels, '/i18n/labels', labels, 'unknown-label-key', 'a label key');
  node(definition as unknown as Node, '', [...SLOTS.form, 'messages', 'labels'], 'id');
  node(definition.submit as unknown as Node, '/submit', SLOTS.action);
  node(definition.cancel as unknown as Node, '/cancel', SLOTS.action);
  (definition.steps ?? []).forEach((step, index) => {
    node(step as unknown as Node, `/steps/${index}`, SLOTS.step, 'id');
    for (const name of ['next', 'back', 'skip'] as const) node(step[name] as unknown as Node, `/steps/${index}/${name}`, SLOTS.action);
  });
  for (const { field, path } of entries) {
    node(field as unknown as Node, path, field.type === 'group' ? SLOTS.group : SLOTS.field, 'key');
    field.options?.forEach((option, index) => node(option as unknown as Node, `${path}/options/${index}`, SLOTS.option, 'value'));
    const rules = field.validation as Node;
    if (rules)
      node(
        rules,
        `${path}/validation`,
        SLOTS.validation.filter((rule) => hasRule(rules, rule)),
      );
  }
  for (const entry of nodes) if (entry.node.type === 'section') node(entry.node as unknown as Node, entry.path, SLOTS.section, 'key');
  if (keyed) {
    for (const [path, id] of ids) {
      if (typeof id === 'string' && /[.:]/.test(id))
        issues.push(
          warning(
            'i18n-unsafe-identifier',
            path,
            `${JSON.stringify(id)} contains "." or ":"`,
            'Use letters, digits, "-" or "_", because translation keys and TMS imports split on these characters',
          ),
        );
    }
  }
  return issues;
}
