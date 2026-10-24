import type { ControlOption } from '@formhaus/vue/controls';
import { defineComponent, h, type PropType, provide } from 'vue';

export const RevealBlock = defineComponent({
  props: { reveal: { type: Object as PropType<NonNullable<ControlOption['reveal']>>, required: true } },
  setup(props) {
    provide(Symbol.for('vuetify:selection-control-group'), undefined);
    return () =>
      h(
        'div',
        { id: props.reveal.id, 'data-fh': 'reveal', hidden: !props.reveal.open, class: 'ms-5 ps-5 border-s-md' },
        props.reveal.children,
      );
  },
});
