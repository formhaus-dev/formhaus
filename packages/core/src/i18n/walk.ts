import type { FormDefinition, FormField } from '../types';
import type { Entry, NodeKind } from './nodes';

export interface TextNode {
  kind: NodeKind;
  node: Entry;
  path: string;
  address: string[];
  field?: FormField;
}

export function textNodes(definition: FormDefinition): TextNode[] {
  const list: TextNode[] = [];
  const add = (kind: NodeKind, node: unknown, path: string, address: string[], field?: FormField) => {
    if (node) list.push({ kind, node: node as Entry, path, address, field });
  };
  const actions = (owner: Entry, path: string, address: string[], names: string[]) => {
    for (const name of names) add('action', owner[name], `${path}/${name}`, [...address, name]);
  };
  const fields = (items: FormField[], path: string, address: string[]) =>
    items.forEach((field, index) => {
      const at = `${path}/fields/${index}`;
      const key = [...address, 'fields', field.key];
      add('field', field, at, key);
      field.options?.forEach((option, position) => {
        add('option', option, `${at}/options/${position}`, [...key, 'options', option.value]);
      });
      add('validation', field.validation, `${at}/validation`, [...key, 'validation'], field);
    });
  add('form', definition, '', []);
  actions(definition as unknown as Entry, '', [], ['submit', 'cancel']);
  const steps = definition.steps ?? [];
  steps.forEach((step, index) => {
    const path = `/steps/${index}`;
    const address = ['steps', step.id];
    add('step', step, path, address);
    actions(step as unknown as Entry, path, address, ['next', 'back', 'skip']);
    fields(step.fields, path, address);
  });
  if (!steps.length) fields(definition.fields ?? [], '', []);
  return list;
}

export function slotAddress(kind: NodeKind, address: string[], slot: string): string[] {
  return kind === 'option' ? address : [...address, slot];
}
