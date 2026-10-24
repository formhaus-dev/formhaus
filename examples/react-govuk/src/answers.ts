import {
  FORMAT_VERSION,
  isGroup,
  isSection,
  recallText,
  type FormDefinition,
  type FormField,
  type FormGroup,
  type FormNode,
  type HiddenFormField,
  type RecallItem,
} from '@formhaus/core';

export interface Answer {
  key: string;
  label: string;
  value: string;
}

type Values = Record<string, unknown>;

export interface CompletionProps {
  definition: FormDefinition;
  values: Values;
  onRestart: () => void;
}

export const completion = {
  title: 'Response submitted',
  body: 'Thank you. We have received your answers.',
  answers: 'Your answers',
  again: 'Submit another response',
};

const flat = (nodes: FormNode[]): (FormField | HiddenFormField | FormGroup)[] =>
  nodes.flatMap((node) => (isSection(node) ? node.fields : [node]));

export function answers(definition: FormDefinition, values: Values): Answer[] {
  const source = { ...definition, formatVersion: FORMAT_VERSION };
  const text = (field: FormField, scope: Values, item?: RecallItem) =>
    typeof scope[field.key] === 'boolean' && ['checkbox', 'switch'].includes(field.type)
      ? scope[field.key]
        ? 'Yes'
        : 'No'
      : recallText(source, `{{${field.key}}}`, values, { item }).trim();
  const nodes = flat([...(definition.steps ?? []).flatMap((step) => step.fields), ...(definition.fields ?? [])]);
  return nodes
    .flatMap((node): Answer[] => {
      if (!isGroup(node))
        return node.type === 'hidden' ? [] : [{ key: node.key, label: node.label ?? node.key, value: text(node as FormField, values) }];
      const items = Array.isArray(values[node.key]) ? (values[node.key] as Values[]) : [];
      return items.map((entry, index) => {
        const item = { group: node.key, index };
        const title = (node.itemLabel ?? '{label} {index}').replace('{label}', node.label).replace('{index}', String(index + 1));
        const parts = node.fields.map((field) => text(field, entry, item)).filter(Boolean);
        return { key: `${node.key}.${index}`, label: recallText(source, title, values, { item }), value: parts.join(', ') };
      });
    })
    .filter((answer) => answer.value);
}
