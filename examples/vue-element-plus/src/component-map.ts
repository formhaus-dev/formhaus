import type { FieldComponentMap, FieldProps } from '@formhaus/vue';
import { type ControlOption, mapControls } from '@formhaus/vue/controls';
import {
  ElAutocomplete,
  ElButton,
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
  ElUpload,
  type UploadFile,
} from 'element-plus';
import { h, type VNode } from 'vue';
import FieldShell from './fields/FieldShell.vue';
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

const upload = (f: FieldProps) => {
  const files = f.value instanceof File ? [{ name: f.value.name }] : [];
  return {
    id: undefined,
    'aria-invalid': undefined,
    'aria-required': undefined,
    'aria-describedby': undefined,
    'data-testid': undefined,
    onBlur: undefined,
    onFocus: undefined,
    fileList: files,
    autoUpload: false,
    onChange: (file: UploadFile) => f.change(file.raw ?? null),
    onRemove: () => f.change(null),
    children: () =>
      h(ElButton, { ...f.attrs, type: f.invalid ? 'danger' : 'default', plain: true }, () =>
        files.length ? 'Replace file' : 'Choose file',
      ),
  };
};

const cells = (f: FieldProps, options: ControlOption[]) => ({
  'aria-labelledby': `${f.id}-label`,
  'aria-describedby': f.describedBy,
  class: 'matrix__cells',
  children: () =>
    options.map((option, index) =>
      h('span', { key: option.value, class: 'matrix__cell' }, [
        h(
          ElRadio,
          { value: option.value, 'aria-label': option.label, 'data-testid': testId(f, option, index), onBlur: f.blur, onFocus: f.focus },
          () => h('span', { class: 'sr-only' }, option.label),
        ),
      ]),
    ),
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
    freeText: true,
    matrix: mapControls({ shell: MatrixRow, controls: { radio: [ElRadioGroup, cells] } }).radio,
    controls: {
      input: ElInput,
      password: [ElInput, (f) => ({ type: 'password', showPassword: true, autocomplete: f.attrs.autocomplete ?? 'off' })],
      textarea: [ElInput, () => ({ type: 'textarea' })],
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
          fetchSuggestions: (query: string, show: (items: { value: string }[]) => void) => {
            const term = query.trim().toLowerCase();
            show(f.options.filter((option) => option.label.toLowerCase().includes(term)).map((option) => ({ value: option.label })));
          },
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
      file: [ElUpload, upload],
    },
  }),
};
