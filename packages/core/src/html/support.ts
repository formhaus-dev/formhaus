import type { FormDefinition, FormField, FormNode } from '../types';
import { hasOwn, isSection } from '../visibility/nodes';

const pages = new WeakMap<FormDefinition, FormField[]>();

const flat = (nodes: readonly FormNode[]): FormField[] =>
  nodes.flatMap((node) => (isSection(node) ? flat(node.fields) : [node as FormField]));

export function pageFields(definition: FormDefinition): FormField[] {
  const cached = pages.get(definition);
  if (cached) return cached;
  const fields = flat(definition.fields ?? []);
  const blocked = definition.steps?.length ? undefined : fields.find((field) => field.type === 'group' || field.type === 'file');
  if (definition.steps?.length || blocked)
    throw new Error(
      `Static markup renders one page of fields. This definition has ${blocked ? `the ${blocked.type} "${blocked.key}"` : 'steps'}, which it does not support.`,
    );
  pages.set(definition, fields);
  return fields;
}

export function assertNames(fields: readonly FormField[], hiddenInputs: Record<string, string> | undefined): void {
  if (hiddenInputs)
    for (const { key } of fields)
      if (hasOwn(hiddenInputs, key))
        throw new Error(`The field key "${key}" has the same name as a hidden input. Rename the field or the hidden input.`);
}
