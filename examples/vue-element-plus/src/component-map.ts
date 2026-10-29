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
  type UploadFile,
} from 'element-plus';
import { h, type VNode } from 'vue';
import FieldShell from './fields/FieldShell.vue';
import FileUpload from './fields/FileUpload.vue';
import MatrixRow from './fields/MatrixRow.vue';

const testId = (f: FieldProps, option: ControlOption, index: number) =>
  f.option({ ...option, value: String(option.value) }, index)['data-testid'];
const setAttrs = (input: Element | null | undefined, attrs: object) => {
  for (const [name, value] of Object.entries(attrs)) {
    if (value) input?.setAttribute(name, String(value));
    else input?.removeAttribute(name);
  }
};
const inner = (f: FieldProps) => {
  const link = ({ el }: VNode) => setAttrs((el as Node).parentElement?.querySelector('input'), f.aria);
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
    f,
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

const controls = (id?: string) => {
  const link = ({ el }: VNode) => setAttrs((el as Element).querySelector('input'), { 'aria-controls': id });
  return { onVnodeMounted: link, onVnodeUpdated: link };
};

const radios = (f: FieldProps, options: ControlOption[]) => {
  const tiles = options.some((option) => option.image);
  return {
    ariaLabel: f.label,
    class: ['choices', { 'choices--tiles': tiles }],
    children: () =>
      options.flatMap((option, index) => [
        h(
          ElRadio,
          {
            key: option.value,
            value: option.value,
            border: tiles,
            'data-testid': testId(f, option, index),
            ...controls(option.reveal?.id),
          },
          () => [option.image && h('img', { src: option.image, alt: '', class: 'choice__image' }), option.label],
        ),
        option.reveal
          ? h(
              'div',
              { key: option.reveal.id, id: option.reveal.id, 'data-fh': 'reveal', hidden: !option.reveal.open, class: 'reveal' },
              option.reveal.children,
            )
          : [],
      ]),
  };
};

const counted = (f: FieldProps) => (f.maxLength ? { maxlength: f.maxLength, showWordLimit: true } : {});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: FieldShell,
    kinds: { multiselect: 'input' },
    freeText: true,
    conditionalReveal: ['radio'],
    matrix: mapControls({ shell: MatrixRow, controls: { radio: { component: ElRadioGroup, props: cells } } }).radio,
    controls: {
      input: { component: ElInput, props: counted },
      password: {
        component: ElInput,
        props: (f) => ({ ...counted(f), type: 'password', showPassword: true, autocomplete: f.attrs.autocomplete ?? 'off' }),
      },
      textarea: { component: ElInput, props: (f) => ({ ...counted(f), type: 'textarea', autosize: { minRows: 3 } }) },
      number: {
        component: ElInputNumber,
        props: (f) => ({
          ...inner(f),
          modelValue: typeof f.value === 'number' ? f.value : null,
          valueOnClear: null,
          controlsPosition: 'right',
          class: 'field__control',
        }),
      },
      date: { component: ElDatePicker, props: picked('YYYY-MM-DD') },
      datetime: { component: ElDatePicker, props: (f) => ({ ...picked('YYYY-MM-DD HH:mm', 'YYYY-MM-DDTHH:mm')(f), type: 'datetime' }) },
      time: { component: ElTimePicker, props: picked('HH:mm') },
      select: { component: ElSelect, props: choose('Select an option') },
      multiselect: { component: ElSelect, props: (f, options) => ({ ...choose('Select options')(f, options), multiple: true }) },
      autocomplete: {
        component: ElAutocomplete,
        props: (f) => ({
          fetchSuggestions: (query: string, show: (items: { value: string }[]) => void) => {
            const term = query.trim().toLowerCase();
            show(f.options.filter((option) => option.label.toLowerCase().includes(term)).map((option) => ({ value: option.label })));
          },
          clearable: true,
          class: 'field__control',
        }),
      },
      checkbox: { component: ElCheckbox, props: inner },
      switch: { component: ElSwitch, props: inner },
      radio: { component: ElRadioGroup, props: radios },
      scale: {
        component: ElRadioGroup,
        props: (f, options) => ({
          type: 'button',
          ariaLabel: f.label,
          options: options.map((option, index) => ({ ...option, 'data-testid': testId(f, option, index) })),
        }),
      },
      rating: { component: ElRate, props: (f, options) => ({ max: options.length, clearable: true, ariaLabel: f.label }) },
      file: { component: FileUpload, props: upload },
    },
  }),
};
