import { controlShellProps, mapControls, type ControlOption } from '@formhaus/vue/controls';
import { defineComponent, h, type PropType } from 'vue';

const text = (event: Event) => (event.target as HTMLInputElement).value;

const valueProps = { modelValue: { type: String, default: '' }, label: String };

const PasswordControl = defineComponent({
  props: valueProps,
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h('input', {
        class: 'input',
        type: 'password',
        autocomplete: 'off',
        spellcheck: false,
        'aria-label': props.label,
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', text(event)),
      }),
});

const TextareaControl = defineComponent({
  props: valueProps,
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h('textarea', {
        class: 'ai-prompt',
        rows: 3,
        'aria-label': props.label,
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', text(event)),
      }),
});

const SelectControl = defineComponent({
  props: { ...valueProps, options: { type: Array as PropType<ControlOption[]>, default: () => [] } },
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h(
        'select',
        { 'aria-label': props.label, value: props.modelValue, onChange: (event: Event) => emit('update:modelValue', text(event)) },
        props.options.map((option) => h('option', { value: option.value }, option.label)),
      ),
});

const SegmentedControl = defineComponent({
  props: { ...valueProps, options: { type: Array as PropType<ControlOption[]>, default: () => [] }, disabled: Boolean },
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h(
        'div',
        { class: 'segmented small', role: 'group', 'aria-label': props.label },
        props.options.map((option) =>
          h(
            'button',
            {
              type: 'button',
              class: ['mode', { active: option.value === props.modelValue }],
              'aria-pressed': String(option.value === props.modelValue),
              disabled: props.disabled,
              onClick: () => emit('update:modelValue', option.value),
            },
            option.label,
          ),
        ),
      ),
});

const Shell = defineComponent({
  props: controlShellProps,
  setup:
    (props, { slots }) =>
    () =>
      h('div', { ...props.rootProps, class: ['ai-field', `ai-field--${props.field.key}`] }, [
        slots.default?.(),
        props.f.error ? h('p', { id: props.f.errorId, class: 'ai-error', role: 'alert' }, props.f.error) : null,
      ]),
});

export const aiComponents = mapControls({
  shell: Shell,
  controls: {
    textarea: { component: TextareaControl, props: (f) => ({ label: f.label }) },
    select: { component: SelectControl, optionsProp: 'options', props: (f) => ({ label: f.label }) },
    radio: { component: SegmentedControl, optionsProp: 'options', props: (f) => ({ label: f.label }) },
    password: { component: PasswordControl, props: (f) => ({ label: f.label }) },
  },
});
