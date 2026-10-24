import { defineComponent, h, type PropType } from 'vue';
import { controlShellProps, mapControls } from '../../src/controls';
import type { FieldProps } from '../../src/composables/useFieldProps';
import { fieldComponentProps } from '../../src/props';

type Emit = (event: 'update:modelValue' | 'update:value', value: unknown) => void;

const control = (render: (props: Record<string, unknown>, emit: Emit, attrs: Record<string, unknown>) => unknown) =>
  defineComponent({
    inheritAttrs: false,
    props: { id: String, label: String, modelValue: null, options: Array as PropType<{ value: string | number; label: string }[]> },
    emits: ['update:modelValue', 'update:value'],
    setup:
      (props, { emit, attrs }) =>
      () =>
        render(props, emit, attrs),
  });

const target = (event: Event) => event.target as HTMLInputElement;

const TextInput = control((props, emit, attrs) => [
  props.label ? h('label', { for: props.id }, props.label as string) : null,
  h('input', { ...attrs, id: props.id, value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', event) }),
]);

const Plain = control((props, emit, attrs) =>
  h('input', {
    ...attrs,
    id: props.id,
    value: props.modelValue,
    onInput: (event: Event) => emit('update:modelValue', target(event).value),
  }),
);

const Area = control((props, emit, attrs) =>
  h('textarea', {
    ...attrs,
    id: props.id,
    value: props.modelValue,
    onInput: (event: Event) => emit('update:modelValue', target(event).value),
  }),
);

const Upload = control((props, emit, attrs) =>
  h('input', { ...attrs, type: 'file', id: props.id, onChange: (event: Event) => emit('update:modelValue', event) }),
);

const DatePick = control((props, emit, attrs) =>
  h('input', {
    ...attrs,
    id: props.id,
    value: props.modelValue,
    onInput: (event: Event) => {
      const text = target(event).value;
      emit('update:modelValue', text ? { toDate: () => new Date(`${text}T00:00`) } : null);
    },
  }),
);

const Check = control((props, emit, attrs) => [
  h('input', {
    ...attrs,
    type: 'checkbox',
    id: props.id,
    checked: props.modelValue,
    onChange: (event: Event) => emit('update:modelValue', event),
  }),
  props.label ? h('label', { for: props.id }, props.label as string) : null,
]);

const Choices = control((props, emit, attrs) =>
  h(
    'div',
    { role: 'radiogroup', id: props.id, 'aria-label': props.label },
    (props.options as { value: string | number; label: string }[]).map((option) =>
      h('label', { key: option.value }, [
        h('input', {
          type: 'radio',
          name: attrs.name,
          value: option.value,
          disabled: attrs.disabled,
          checked: String(props.modelValue) === String(option.value),
          onChange: (event: Event) => emit('update:modelValue', target(event).value),
        }),
        option.label,
      ]),
    ),
  ),
);

const Picks = control((props, emit) =>
  h(
    'select',
    {
      id: props.id,
      multiple: true,
      value: props.modelValue,
      onChange: (event: Event) =>
        emit(
          'update:modelValue',
          [...(event.target as HTMLSelectElement).selectedOptions].map((option) => ({ value: option.value })),
        ),
    },
    (props.options as { value: string; label: string }[]).map((option) =>
      h('option', { key: option.value, value: option.value }, option.label),
    ),
  ),
);

const Stars = control((props, emit) =>
  h(
    'div',
    { id: props.id, role: 'radiogroup' },
    [1, 2, 3]
      .map((star) =>
        h('span', {
          key: star,
          role: 'radio',
          tabindex: 0,
          'aria-label': `${star} stars`,
          'aria-checked': props.modelValue === star,
          onClick: () => emit('update:modelValue', star),
        }),
      )
      .concat(h('button', { type: 'button', onClick: () => emit('update:modelValue', 0) }, 'Clear'), h('input', { 'aria-label': 'Note' })),
  ),
);

const Picker = control((props, emit) => {
  let arrow = false;
  const pick = (event: Event) => emit('update:value', (event.currentTarget as HTMLButtonElement).value);
  return h(
    'div',
    { id: props.id, role: 'radiogroup' },
    (props.options as { value: string | number; label: string }[]).map((option) =>
      h(
        'button',
        {
          key: option.value,
          type: 'button',
          role: 'radio',
          value: String(option.value),
          'aria-checked': String(props.modelValue) === String(option.value),
          onKeydown: (event: KeyboardEvent) => {
            const current = event.currentTarget as HTMLElement;
            const target =
              event.key === 'ArrowDown'
                ? current.nextElementSibling
                : event.key === 'Home'
                  ? current.parentElement?.firstElementChild
                  : null;
            if (target) {
              arrow = true;
              (target as HTMLElement).focus();
              arrow = false;
            }
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault();
              pick(event);
            }
          },
          onFocus: (event: Event) => arrow && pick(event),
          onClick: pick,
        },
        option.label,
      ),
    ),
  );
});

const Shell = defineComponent({
  props: controlShellProps,
  setup:
    (props, { slots }) =>
    () => {
      const { kind, f, rootProps, anchors } = props;
      const texts = [f.helperText ? h('p', { id: f.helperId }, f.helperText) : null, f.error ? h('p', { id: f.errorId }, f.error) : null];
      const shown = anchors.map((anchor) => anchor?.label).join('|') || undefined;
      if (kind === 'group')
        return h('fieldset', { ...rootProps, 'data-kind': kind, 'data-anchors': shown }, [
          h('legend', f.label),
          slots.default?.(),
          ...texts,
        ]);
      const label = h('label', { for: f.id }, f.label);
      return h('div', { ...rootProps, 'data-kind': kind }, [
        kind === 'input' ? label : null,
        slots.default?.(),
        kind === 'inline' ? label : null,
        ...texts,
      ]);
    },
});

const MatrixRow = defineComponent({
  props: fieldComponentProps,
  setup: (props) => () => h('div', { 'data-row': props.field.key }, props.field.label),
});

const controls = {
  input: TextInput,
  password: Plain,
  textarea: [Plain, () => ({ placeholder: 'Long' })],
  select: [Plain, (f: FieldProps) => ({ list: f.options.map((option) => option.value).join() })],
  date: DatePick,
  checkbox: Check,
  switch: Check,
  radio: [Choices, 'options'],
  scale: [Choices, 'options'],
  rating: Stars,
  multiselect: [Picks, 'options'],
} as const;

const labels = (f: FieldProps) => ({ label: f.label });

const free = { autocomplete: Plain, textarea: Area, file: Upload, scale: [Choices, 'options'] } as const;

export const mapped = {
  typed: mapControls({ shell: Shell, freeText: true, controls: free }),
  plain: mapControls({ shell: Shell, controls: free }),
  named: mapControls({ shell: Shell, controls: { radio: [Picker, 'options', 'onUpdate:value'] } }),
  shell: mapControls({ shell: Shell, kinds: { multiselect: 'input' }, matrix: MatrixRow, controls }),
  bare: mapControls({ shell: null, labels, kinds: { multiselect: 'input' }, controls }),
  mixed: mapControls({ shell: { group: Shell }, labels, controls }),
  doubled: mapControls({ shell: Shell, labels, controls: { input: [TextInput, labels] } }),
};
