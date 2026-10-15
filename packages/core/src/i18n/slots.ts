import { getAllFields } from '../engine/engine-utils';
import { isGroup } from '../visibility/nodes';
import type { FormDefinition, FormField, LabelKey, MessageKey } from '../types';
import { DEFAULT_MESSAGES, formatText } from '../validation/default-messages';
import { typeMessageKeys } from '../validation/type-checks';
import { DEFAULT_LABELS, hasRule, SLOTS, type Entry } from './nodes';
import { slotAddress, textNodes, type TextNode } from './walk';

export type SlotKind = 'text' | 'rule' | 'message' | 'label';

export interface Slot {
  kind: SlotKind;
  address: string[];
  key?: string;
  source?: string;
  fallback: string;
  params: Record<string, unknown>;
  template: boolean;
  apply: (text: string) => void;
}

const BOUNDS: Record<string, string> = { minLength: 'min', maxLength: 'max', min: 'min', max: 'max' };

function ruleKey(field: FormField, rule: string): MessageKey {
  return (
    (field.type === 'multiselect' || field.type === 'group') && rule.endsWith('Length') ? rule.replace('Length', 'Items') : rule
  ) as MessageKey;
}

function usedMessages(definition: FormDefinition): Set<string> {
  const keys = new Set([...Object.keys(definition.messages ?? {}), ...Object.keys(definition.i18n?.messages ?? {})]);
  for (const field of getAllFields(definition).flatMap((field) => (isGroup(field) ? [field, ...field.fields] : [field]))) {
    const rules = (field.validation ?? {}) as Entry;
    for (const rule of SLOTS.validation) {
      if (hasRule(rules, rule) && typeof rules[rule === 'required' ? rule : `${rule}Message`] !== 'string') keys.add(ruleKey(field, rule));
    }
    for (const key of typeMessageKeys(field)) keys.add(key);
  }
  return keys;
}

function nodeSlots(definition: FormDefinition, { kind, node, address, field }: TextNode): Slot[] {
  const keys = (node.i18n ?? {}) as Record<string, string>;
  return SLOTS[kind].flatMap((slot): Slot[] => {
    if (kind !== 'validation') {
      const source = node[slot];
      if (typeof source !== 'string') return [];
      return [
        {
          kind: 'text',
          address: slotAddress(kind, address, slot),
          key: keys[slot],
          source,
          fallback: source,
          params: {},
          template: true,
          apply: (text) => {
            node[slot] = text;
          },
        },
      ];
    }
    if (!hasRule(node, slot) || !field) return [];
    const literalName = slot === 'required' ? slot : `${slot}Message`;
    const literal = typeof node[literalName] === 'string' ? (node[literalName] as string) : undefined;
    const params = BOUNDS[slot] ? { [BOUNDS[slot]]: node[slot] } : {};
    const message = ruleKey(field, slot);
    const fallback = literal ?? formatText(definition.messages?.[message] ?? DEFAULT_MESSAGES[message], params);
    return [
      {
        kind: 'rule',
        address: [...address, slot],
        key: keys[slot],
        source: literal,
        fallback,
        params,
        template: literal !== undefined || !!keys[slot],
        apply: (text) => {
          node[literalName] = text;
        },
      },
    ];
  });
}

function catalogSlots(definition: FormDefinition, name: 'messages' | 'labels', used: Set<string>): Slot[] {
  const defaults: Record<string, string> = name === 'messages' ? DEFAULT_MESSAGES : DEFAULT_LABELS;
  const keys = (definition.i18n?.[name] ?? {}) as Record<string, string>;
  return Object.keys(defaults).map((item) => {
    const source = (definition[name] as Record<string, string> | undefined)?.[item] ?? defaults[item];
    return {
      kind: name === 'messages' ? 'message' : 'label',
      address: [name, item],
      key: keys[item],
      source,
      fallback: source,
      params: {},
      template: used.has(item),
      apply: (text: string) => {
        ((definition[name] ??= {}) as Record<string, string>)[item] = text;
      },
    };
  });
}

export function definitionSlots(definition: FormDefinition): Slot[] {
  const steps = !!definition.steps?.length;
  const labels = new Set<LabelKey>(steps ? ['continue', 'back', 'stepOf', 'errorSummary'] : ['errorSummary']);
  if (getAllFields(definition).some(isGroup))
    for (const key of [
      'addItem',
      'removeItem',
      'itemLabel',
      'itemAdded',
      'itemRemoved',
      'removeItemNamed',
      'removeItemPrompt',
      'removeItemBody',
      'cancel',
    ] as const)
      labels.add(key);
  return [
    ...textNodes(definition).flatMap((node) => nodeSlots(definition, node)),
    ...catalogSlots(definition, 'messages', usedMessages(definition)),
    ...catalogSlots(definition, 'labels', labels),
  ];
}
