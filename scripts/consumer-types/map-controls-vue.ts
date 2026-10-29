import type { FieldComponentMap } from '@formhaus/vue';
import { controlShellProps, mapControls } from '@formhaus/vue/controls';
import { defineComponent, h, type PropType } from 'vue';

const Shell = defineComponent({
  props: controlShellProps,
  setup:
    (props, { slots }) =>
    () =>
      h('div', props.rootProps, [h('label', { for: props.f.id }, props.f.label), slots.default?.()]),
});
const Input = defineComponent({
  props: { modelValue: String, size: String as PropType<'small' | 'large'> },
  setup: (props) => () => h('input', { value: props.modelValue }),
});
const Picker = defineComponent({
  props: { items: Array as PropType<{ value: string | number }[]> },
  emits: ['update:value'],
  setup: () => () => h('div'),
});

export const objects: FieldComponentMap = mapControls({
  shell: Shell,
  controls: {
    input: { component: Input },
    textarea: { component: Input, props: () => ({ size: 'large' }) },
    select: { component: Input, props: (f, options) => ({ modelValue: f.text + options.length, children: () => f.label }) },
    radio: { component: Picker, optionsProp: 'items', changeProp: 'onUpdate:value' },
    scale: [Picker, 'items', 'onUpdate:value'],
  },
});

export const wrong = [
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { textarea: { component: Input, props: () => ({ size: 1 }) } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, changeProp: 'onUpdate:modelValue' } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { textarea: { component: Input, props: () => ({ width: 1 }) } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, optionsProp: 'options' } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, change: 'onUpdate:value' } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: [Input, (_f, _options, { field }) => ({ size: field.columns })] } }),
];

export const contextual: FieldComponentMap = mapControls({
  shell: Shell,
  controls: {
    radio: [Input, (_f, _options, { kind, field }) => ({ size: field.layout === 'inline' && kind === 'group' ? 'small' : 'large' })],
    scale: { component: Input, props: (_f, _options, { anchors }) => ({ modelValue: anchors.map((anchor) => anchor?.label).join() }) },
    select: [Input, (f) => ({ modelValue: f.loading ? '' : f.freeText.text })],
  },
});
