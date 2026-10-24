import type { FieldOption, FormDefinition, FormField, FormNode, RevealView } from '../types';
import { isSection, topNodes } from '../visibility/nodes';
import { revealTargets } from '../visibility/reveal';

interface Plan {
  parents: Map<FormNode, [FormField, number]>;
  options: Map<FormField, number[]>;
}

export interface RevealSlot<Node = FormNode> {
  index: number;
  option: FieldOption;
  nodes: Node[];
}

export const revealable = new WeakSet<object>();

const plans = new WeakMap<FormDefinition, Plan>();

function planOf(definition: FormDefinition): Plan {
  let plan = plans.get(definition);
  if (plan) return plan;
  plan = { parents: new Map(), options: new Map() };
  const tops = definition.steps?.length ? definition.steps.map((step) => step.fields) : [topNodes(definition)];
  const sections = tops.flatMap((nodes) => nodes.filter(isSection).filter((section) => section.layout !== 'matrix'));
  for (const nodes of [...tops, ...sections.map((section) => section.fields as FormNode[])])
    revealTargets(nodes).forEach((target, index) => {
      if (!target) return;
      const parent = nodes[target.parent] as FormField;
      const options = plan!.options.get(parent) ?? [];
      plan!.parents.set(nodes[index], [parent, target.option]);
      if (!options.includes(target.option))
        plan!.options.set(
          parent,
          [...options, target.option].sort((a, b) => a - b),
        );
    });
  plans.set(definition, plan);
  return plan;
}

export function revealLayout(definition: FormDefinition, nodes: readonly FormNode[], can: (field: FormField) => boolean) {
  const { parents, options } = planOf(definition);
  const shown = new Set(nodes);
  const slots = new Map<FormField, RevealSlot[]>();
  const slotsOf = (field: FormField) => {
    let list = slots.get(field);
    if (!list) slots.set(field, (list = (options.get(field) ?? []).map((index) => ({ index, option: field.options![index], nodes: [] }))));
    return list;
  };
  const top: FormNode[] = [];
  for (const node of nodes) {
    const [parent, index] = parents.get(node) ?? [];
    if (parent && shown.has(parent) && can(parent))
      slotsOf(parent)
        .find((slot) => slot.index === index)!
        .nodes.push(node);
    else top.push(node);
  }
  return {
    nodes: top,
    slots: (field: FormNode): RevealSlot[] =>
      options.has(field as FormField) && can(field as FormField) ? slotsOf(field as FormField) : [],
  };
}

const revealDomId = (fieldId: string, index: number): string => `${fieldId}-reveal-${index}`;

export function revealViews<Children>(
  slots: RevealSlot[],
  fieldId: string,
  render: (nodes: FormNode[]) => Children,
): RevealView<Children>[] | undefined {
  return slots.length
    ? slots.map(({ index, option, nodes }) => ({
        value: option.value,
        id: revealDomId(fieldId, index),
        open: nodes.length > 0,
        children: render(nodes),
      }))
    : undefined;
}
