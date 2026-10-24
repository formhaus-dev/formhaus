import { isGroup, isSection, type FieldOption, type FormEngine, type FormField, type FormNode, type FormSection } from '@formhaus/core';
import { fieldDomId, matrixColumns, type RevealSlot, revealLayout, revealViews } from '@formhaus/core/internal';
import { type Component, defineComponent, Fragment, h, inject, type InjectionKey, type PropType, type VNode } from 'vue';
import FieldResolver from './FieldResolver.vue';
import FormGroup from './FormGroup.vue';

export interface NodeContext {
  formId: string;
  engine: () => FormEngine;
  section: () => Component;
  can: (field: FormField) => boolean;
  reveal: () => boolean;
  nodeProps: (field: FormField, columns?: FieldOption[], row?: number) => Record<string, unknown>;
  sectionProps: (section: FormSection) => Record<string, unknown>;
}

export const NODE_CONTEXT: InjectionKey<NodeContext> = Symbol('fhNodes');

type Slots = (field: FormNode) => RevealSlot[];

export const nodeLayout = (context: NodeContext, nodes: readonly FormNode[]) =>
  revealLayout(context.engine(), nodes, context.reveal() ? context.can : undefined);

export const FormNodeView = /* @__PURE__ */ defineComponent({
  props: {
    node: { type: Object as PropType<FormNode>, required: true },
    slots: { type: Function as PropType<Slots>, required: true },
    columns: Array as PropType<FieldOption[]>,
    row: Number,
  },
  setup(props) {
    const context = inject(NODE_CONTEXT)!;
    const list = (nodes: readonly FormNode[], slots: Slots, columns?: FieldOption[]): VNode[] =>
      nodes.map((node, row) => h(FormNodeView, { key: node.key, node, slots, columns, row }));
    return () => {
      const { node } = props;
      if (isSection(node)) {
        const inner = nodeLayout(context, node.fields);
        const columns = matrixColumns(node);
        return h(context.section(), context.sectionProps(node), { default: () => list(inner.nodes, inner.slots, columns) });
      }
      const field = node as FormField;
      if (isGroup(node)) return h(FormGroup as Component, context.nodeProps(field));
      const id = fieldDomId(context.formId, node.key, context.engine().definition);
      return h(FieldResolver as Component, {
        ...context.nodeProps(field, props.columns, props.row),
        reveals: revealViews(props.slots(node), id, (nested) => h(Fragment, list(nested, props.slots))),
      });
    };
  },
});
