import { optionText, optionValue } from '@formhaus/core/fields';
import type { FieldComponentMap, FieldProps } from '@formhaus/vue';
import { type ControlOption, mapControls } from '@formhaus/vue/controls';
import {
  ElAutocomplete,
  ElCheckbox,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSwitch,
  ElTimePicker,
} from 'element-plus';
import { h, type VNode } from 'vue';
import FieldShell from './fields/FieldShell.vue';
import FileField from './fields/FileField.vue';
import MatrixRow from './fields/MatrixRow.vue';

const testId = (f: FieldProps, option: ControlOption, index: number) =>
  f.option({ ...option, value: String(option.value) }, index)['data-testid'];
const inner = (f: FieldProps) => {
  const link = ({ el }: VNode) => {
    const input = (el as Node).parentElement?.querySelector('input');
    for (const [name, value] of Object.entries(f.aria)) {
      if (value) input?.setAttribute(name, String(value));
      else input?.removeAttribute(name);
    }
  };
  return {
    'aria-invalid': undefined,
    'aria-required': undefined,
    'aria-describedby': undefined,
    onVnodeMounted: link,
    onVnodeUpdated: link,
  };
};
const choose = (placeholder: string) => (f: FieldProps, options: ControlOption[]) => ({
  ...inner(f),
  options,
  placeholder: f.placeholder ?? placeholder,
  clearable: !f.required,
});
const picked =
  (format: string, valueFormat = format) =>
  (f: FieldProps) => ({
    ...inner(f),
    modelValue: f.text || null,
    format,
    valueFormat,
    placeholder: f.placeholder ?? format,
    class: 'field__control',
  });

const radios = (f: FieldProps, options: ControlOption[]) => {
  const tiles = options.some((option) => option.image);
  return {
    class: ['choices', { 'choices--tiles': tiles }],
    children: () =>
      options.map((option, index) =>
        h(ElRadio, { key: option.value, value: option.value, border: tiles, 'data-testid': testId(f, option, index) }, () => [
          option.image && h('img', { src: option.image, alt: '', class: 'choice__image' }),
          option.label,
        ]),
      ),
  };
};

export const components: FieldComponentMap = {
  ...mapControls({
    shell: FieldShell,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: ElInput,
      password: [ElInput, (f) => ({ type: 'password', showPassword: true, autocomplete: f.attrs.autocomplete ?? 'off' })],
      textarea: [ElInput, () => ({ type: 'textarea', autosize: { minRows: 3 } })],
      number: [
        ElInputNumber,
        (f) => ({
          ...inner(f),
          modelValue: typeof f.value === 'number' ? f.value : null,
          valueOnClear: null,
          controlsPosition: 'right',
          class: 'field__control',
        }),
      ],
      date: [ElDatePicker, picked('YYYY-MM-DD')],
      datetime: [ElDatePicker, (f) => ({ ...picked('YYYY-MM-DD HH:mm', 'YYYY-MM-DDTHH:mm')(f), type: 'datetime' })],
      time: [ElTimePicker, picked('HH:mm')],
      select: [ElSelect, choose('Select an option')],
      multiselect: [ElSelect, (f, options) => ({ ...choose('Select options')(f, options), multiple: true })],
      autocomplete: [
        ElAutocomplete,
        (f) => ({
          modelValue: optionText(f.options, f.value),
          fetchSuggestions: (query: string, show: (items: { value: string }[]) => void) => {
            const term = query.trim().toLowerCase();
            show(f.options.filter((option) => option.label.toLowerCase().includes(term)).map((option) => ({ value: option.label })));
          },
          'onUpdate:modelValue': (text: string | number) => f.change(optionValue(f.options, String(text))),
          clearable: true,
          class: 'field__control',
        }),
      ],
      checkbox: [ElCheckbox, inner],
      switch: [ElSwitch, inner],
      radio: [ElRadioGroup, radios],
      scale: [
        ElRadioGroup,
        (f, options) => ({
          type: 'button',
          options: options.map((option, index) => ({ ...option, 'data-testid': testId(f, option, index) })),
        }),
      ],
      rating: [ElRate, (f, options) => ({ max: options.length, clearable: true, ariaLabel: f.label })],
    },
  }),
  file: FileField,
};
