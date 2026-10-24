import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FieldOption, FormField, FormNode, RevealView } from '../types';
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

const plans = new WeakMap<object, Plan>();

function planOf(engine: FormEngine): Plan {
  const key = (engine as unknown as EngineInternals).visibility;
  let plan = plans.get(key);
  if (plan) return plan;
  const { definition } = engine;
  const parents: Plan['parents'] = new Map();
  const found = new Map<FormField, Set<number>>();
  const tops = definition.steps?.length ? definition.steps.map((step) => step.fields) : [topNodes(definition)];
  const sections = tops.flatMap((nodes) => nodes.filter(isSection).filter((section) => section.layout !== 'matrix'));
  for (const nodes of [...tops, ...sections.map((section) => section.fields as FormNode[])])
    revealTargets(nodes).forEach((target, index) => {
      if (!target) return;
      const parent = nodes[target.parent] as FormField;
      parents.set(nodes[index], [parent, target.option]);
      (found.get(parent) ?? found.set(parent, new Set()).get(parent)!).add(target.option);
    });
  plan = { parents, options: new Map([...found].map(([parent, indexes]) => [parent, [...indexes].sort((a, b) => a - b)])) };
  plans.set(key, plan);
  return plan;
}

const FLAT = { slots: (): RevealSlot[] => [] };

export function revealLayout(engine: FormEngine, nodes: readonly FormNode[], can?: (field: FormField) => boolean) {
  if (!can) return { nodes, ...FLAT };
  const { parents, options } = planOf(engine);
  const shown = new Set(nodes);
  const slots = new Map<FormField, Map<number, RevealSlot>>();
  const slotsOf = (field: FormField) => {
    let list = slots.get(field);
    if (!list)
      slots.set(
        field,
        (list = new Map((options.get(field) ?? []).map((index) => [index, { index, option: field.options![index], nodes: [] }]))),
      );
    return list;
  };
  const top: FormNode[] = [];
  for (const node of nodes) {
    const [parent, index] = parents.get(node) ?? [];
    if (parent && shown.has(parent) && can(parent)) slotsOf(parent).get(index!)!.nodes.push(node);
    else top.push(node);
  }
  return {
    nodes: top,
    slots: (field: FormNode): RevealSlot[] =>
      options.has(field as FormField) && can(field as FormField) ? [...slotsOf(field as FormField).values()] : [],
  };
}

const revealDomId = (fieldId: string, index: number): string => `${fieldId}--reveal-${index}`;

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
