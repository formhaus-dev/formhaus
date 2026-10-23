import { createContext } from '../definition-validation/context';
import { error, pointer, withTexts, type DefinitionIssue } from '../definition-validation/issues';
import { ISSUE_TEXTS } from '../definition-validation/texts';
import type { FormDefinition } from '../types';
import { i18nWarnings } from './check-warnings';
import { SLOTS, type NodeKind } from './nodes';
import { isEntry } from '../visibility/nodes';
import { textNodes } from './walk';

const TEXTS: Record<NodeKind, readonly string[]> = { ...SLOTS, validation: [] };

type Strings = 'messages' | 'labels' | 'translations';

function strings(value: unknown, path: string, what: Strings, nested: string[] = []): DefinitionIssue[] {
  if (value === undefined) return [];
  if (!isEntry(value)) return [error('invalid-type', path, what)];
  return Object.entries(value).flatMap(([key, item]) =>
    nested.includes(key)
      ? strings(item, `${path}/${key}`, what)
      : typeof item === 'string' && item.trim()
        ? []
        : [error('invalid-type', `${path}/${pointer(key)}`, 'text')],
  );
}

function translationErrors(definition: FormDefinition): DefinitionIssue[] {
  const root = definition as unknown as Record<string, unknown>;
  return [
    ...(root.lang === undefined || typeof root.lang === 'string' ? [] : [error('invalid-type', '/lang', 'string', 'lang')]),
    ...strings(root.messages, '/messages', 'messages'),
    ...strings(root.labels, '/labels', 'labels'),
    ...textNodes(definition).flatMap(({ kind, node, path }) => {
      const block = node.i18n;
      const unbound = isEntry(block) ? TEXTS[kind].filter((slot) => block[slot] !== undefined && typeof node[slot] !== 'string') : [];
      return [
        ...strings(block, `${path}/i18n`, 'translations', kind === 'form' ? ['messages', 'labels'] : []),
        ...unbound.map((slot) => error('i18n-key-without-text', `${path}/i18n/${slot}`, slot)),
      ];
    }),
  ];
}

export function checkTranslations(definition: FormDefinition): DefinitionIssue[] {
  const errors = withTexts(ISSUE_TEXTS, () => translationErrors(definition));
  return errors.length ? errors : i18nWarnings(createContext(definition));
}
