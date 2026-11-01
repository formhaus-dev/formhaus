import type { LabelKey } from '@formhaus/core';
import { moveButtonId } from '@formhaus/core/internal';
import { DefaultGroupItem, groupItemComponentProps, useFileText } from '@formhaus/vue';
import { defineComponent, h } from 'vue';

export const ReorderGroupItem: typeof DefaultGroupItem = /* @__PURE__ */ defineComponent({
  name: 'ReorderGroupItem',
  props: groupItemComponentProps,
  setup(props) {
    const { label } = useFileText();
    const button = (key: LabelKey, to: number) =>
      h(
        'button',
        {
          id: moveButtonId(props.titleId, to < props.index),
          type: 'button',
          class: 'fh-form-actions__button fh-form-actions__button--text fh-group__move',
          'aria-describedby': props.titleId,
          disabled: props.disabled || to < 0 || to >= (props.count ?? 0),
          onClick: () => props.move?.(to),
        },
        h('span', { class: 'fh-group__move-text' }, label(key)),
      );
    return () =>
      h(DefaultGroupItem, props, {
        actions: () =>
          props.move && h('span', { class: 'fh-group__reorder' }, [button('moveUp', props.index - 1), button('moveDown', props.index + 1)]),
      });
  },
});
