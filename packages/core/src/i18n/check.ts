import { createContext } from '../definition-validation/context';
import { error, pointer, type DefinitionIssue } from '../definition-validation/issues';
import type { FormDefinition } from '../types';
import { i18nWarnings } from './check-warnings';
import { SLOTS, type NodeKind } from './nodes';
import { isEntry } from '../visibility/nodes';
import { textNodes } from './walk';

const TEXTS: Record<NodeKind, readonly string[]> = { ...SLOTS, validation: [] };

function strings(value: unknown, path: string, what: string, nested: string[] = []): DefinitionIssue[] {
  if (value === undefined) return [];
  if (!isEntry(value)) return [error('invalid-type', path, `must be an object of ${what}`)];
  return Object.entries(value).flatMap(([key, item]) =>
    nested.includes(key)
      ? strings(item, `${path}/${key}`, what)
      : typeof item === 'string' && item.trim()
        ? []
        : [error('invalid-type', `${path}/${pointer(key)}`, 'must be a non-empty string')],
  );
}

function translationErrors(definition: FormDefinition): DefinitionIssue[] {
  const root = definition as unknown as Record<string, unknown>;
  return [
    ...(root.lang === undefined || typeof root.lang === 'string' ? [] : [error('invalid-type', '/lang', '"lang" must be a string')]),
    ...strings(root.messages, '/messages', 'message templates'),
    ...strings(root.labels, '/labels', 'label templates'),
    ...textNodes(definition).flatMap(({ kind, node, path }) => {
      const block = node.i18n;
      const unbound = isEntry(block) ? TEXTS[kind].filter((slot) => block[slot] !== undefined && typeof node[slot] !== 'string') : [];
      return [
        ...strings(block, `${path}/i18n`, 'translation keys', kind === 'form' ? ['messages', 'labels'] : []),
        ...unbound.map((slot) =>
          error(
            'i18n-unbound-slot',
            `${path}/i18n/${slot}`,
            `"${slot}" has a translation key but no source text`,
            `Add "${slot}" as the fallback text`,
          ),
        ),
      ];
    }),
  ];
}

export function checkTranslations(definition: FormDefinition): DefinitionIssue[] {
  const errors = translationErrors(definition);
  return errors.length ? errors : i18nWarnings(createContext(definition));
}
