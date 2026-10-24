import { type FormDefinition, type FormNode, isGroup, isSection } from '@formhaus/core';
import { createContext } from 'react';

export interface Page {
  title?: string;
  soloSteps: Set<string>;
  soloKeys: Set<string>;
  controllers: Set<string>;
}

export const PageContext = createContext<Page>({ soloSteps: new Set(), soloKeys: new Set(), controllers: new Set() });
export const BackLinkTarget = createContext<HTMLElement | null>(null);

const nested = (node: FormNode) => isGroup(node) || isSection(node);
const walk = (nodes: FormNode[]): FormNode[] => nodes.flatMap((node) => (nested(node) ? [node, ...walk(node.fields)] : [node]));
const allNodes = (definition: FormDefinition) => [...(definition.fields ?? []), ...(definition.steps ?? []).flatMap((step) => step.fields)];

export function pageOf(definition: FormDefinition): Page {
  const solo = (definition.steps ?? []).flatMap((step) => {
    const [only, ...rest] = step.fields;
    return only && !rest.length && !nested(only) && only.type !== 'hidden' ? [[step.id, only.key] as const] : [];
  });
  const conditions = walk(allNodes(definition)).flatMap((node) => [...(node.show ?? []), ...(node.showAny ?? [])]);
  return {
    title: definition.steps?.length ? undefined : definition.title,
    soloSteps: new Set(solo.map(([step]) => step)),
    soloKeys: new Set(solo.map(([, key]) => key)),
    controllers: new Set(conditions.map((condition) => condition.field)),
  };
}

const manual = (nodes: FormNode[]): FormNode[] =>
  nodes.map((node) =>
    nested(node)
      ? ({ ...node, fields: manual(node.fields) } as FormNode)
      : node.type === 'hidden'
        ? node
        : { ...node, autoAdvance: undefined },
  );

export const withContinue = (definition: FormDefinition): FormDefinition => ({
  ...definition,
  fields: definition.fields && manual(definition.fields),
  steps: definition.steps?.map((step) => ({ ...step, fields: manual(step.fields), next: step.next === false ? undefined : step.next })),
});
