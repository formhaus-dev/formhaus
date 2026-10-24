import type { FormField, FormNode } from '../types';
import { conditionOperator } from './evaluate-condition';
import { isGroup, isSection } from './nodes';

export interface RevealTarget {
  parent: number;
  option: number;
}

const OPERATORS: Record<string, string> = { radio: 'eq', multiselect: 'contains' };

const plain = (node: FormNode): node is FormField => !isSection(node) && !isGroup(node) && node.type !== 'hidden';

function canReveal(node: FormNode): node is FormField {
  return (
    plain(node) &&
    !!OPERATORS[node.type] &&
    Array.isArray(node.options) &&
    node.options.length > 0 &&
    !node.optionsFrom &&
    node.layout !== 'inline' &&
    !node.options.some((option) => option.image)
  );
}

function optionOf(parent: FormField, node: FormNode): number {
  if (!plain(node)) return -1;
  const conditions = [...(node.show ?? []), ...(node.showAny ?? [])];
  const [condition] = conditions;
  if (conditions.length !== 1 || condition.field !== parent.key) return -1;
  const operator = conditionOperator(condition);
  if (!operator || operator !== OPERATORS[parent.type]) return -1;
  return parent.options!.findIndex((option) => option.value === condition[operator]);
}

export function revealTargets(nodes: readonly FormNode[]): (RevealTarget | null)[] {
  const targets: (RevealTarget | null)[] = nodes.map(() => null);
  nodes.forEach((parent, index) => {
    if (!canReveal(parent)) return;
    const multiple = parent.type === 'multiselect';
    let last = -1;
    for (let at = index + 1; at < nodes.length; at++) {
      const option = optionOf(parent, nodes[at]);
      if (option < 0 || (multiple && (option < last || (parent.randomize && last >= 0 && option !== last)))) break;
      targets[at] ??= { parent: index, option };
      last = option;
    }
  });
  return targets;
}
