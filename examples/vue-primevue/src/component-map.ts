import { type DateType, fromDate, toDate } from '@formhaus/core/fields';
import type { FieldComponentMap, FieldProps } from '@formhaus/vue';
import { type ControlOption, mapControls } from '@formhaus/vue/controls';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Password from 'primevue/password';
import RadioButton from 'primevue/radiobutton';
import RadioButtonGroup from 'primevue/radiobuttongroup';
import Rating from 'primevue/rating';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import ToggleSwitch from 'primevue/toggleswitch';
import { h } from 'vue';
import AutocompleteControl from './fields/AutocompleteControl.vue';
import FileField from './fields/FileField.vue';
import MatrixRow from './fields/MatrixRow.vue';
import FieldShell from './fields/FieldShell.vue';

const root = {
  id: undefined,
  'aria-invalid': undefined,
  'aria-required': undefined,
  'aria-describedby': undefined,
  'data-testid': undefined,
};
const look = (f: FieldProps) => ({ invalid: f.invalid, fluid: true });
const aria = (f: FieldProps) => ({ ...f.aria, 'data-testid': f.testId });
const inner = (f: FieldProps) => ({ ...root, inputId: f.id, invalid: f.invalid });
const fluid = (f: FieldProps) => ({ ...inner(f), fluid: true });
const text = (f: FieldProps) => ({ ...fluid(f), pt: { pcInputText: { root: aria(f) } } });
const listed = (options: ControlOption[]) => ({ options, optionLabel: 'label', optionValue: 'value' });
const placeholders: Record<DateType, string> = { date: 'YYYY-MM-DD', time: 'HH:mm', datetime: 'YYYY-MM-DD HH:mm' };

const picked = (type: DateType) => (f: FieldProps) => ({
  ...text(f),
  modelValue: toDate(f.value),
  dateFormat: 'yy-mm-dd',
  hourFormat: '24',
  showTime: type === 'datetime',
  timeOnly: type === 'time',
  showIcon: type !== 'time',
  iconDisplay: 'input',
  placeholder: f.placeholder ?? placeholders[type],
  onInput: (event: Event) => {
    const typed = (event.target as HTMLInputElement).value.trim().replace(' ', 'T');
    if (!typed || fromDate(toDate(typed), type) === typed) f.change(typed);
  },
});

const radios = (f: FieldProps, options: ControlOption[]) => ({
  ...root,
  invalid: f.invalid,
  class: ['choices', { 'choices--tiles': options.some((option) => option.image) }],
  children: () =>
    options.map((option, index) => {
      const { id, 'data-testid': testId, onBlur, onFocus } = f.option({ ...option, value: String(option.value) }, index);
      return h('label', { key: option.value, for: id, class: 'choice' }, [
        option.image && h('img', { src: option.image, alt: '', class: 'choice__image' }),
        h('span', { class: 'choice__row' }, [
          h(RadioButton, {
            inputId: id,
            value: option.value,
            invalid: f.invalid,
            disabled: f.disabled,
            'data-testid': testId,
            onBlur,
            onFocus,
          }),
          option.label,
        ]),
      ]);
    }),
});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: FieldShell,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: [InputText, look],
      password: [
        Password,
        (f) => ({ ...fluid(f), inputProps: { ...aria(f), autocomplete: f.attrs.autocomplete }, feedback: false, toggleMask: true }),
      ],
      number: [
        InputNumber,
        (f) => ({
          ...text(f),
          modelValue: typeof f.value === 'number' ? f.value : null,
          useGrouping: false,
          maxFractionDigits: f.inputMode === 'numeric' ? 0 : 4,
        }),
      ],
      date: [DatePicker, picked('date')],
      time: [DatePicker, picked('time')],
      datetime: [DatePicker, picked('datetime')],
      textarea: [Textarea, (f) => ({ ...look(f), rows: 4, autoResize: true })],
      select: [
        Select,
        (f, options) => ({
          ...root,
          ...listed(options),
          labelId: f.id,
          ariaLabelledby: `${f.id}-label`,
          ...look(f),
          pt: { label: aria(f) },
          placeholder: f.placeholder ?? 'Select an option',
          showClear: !f.required,
        }),
      ],
      multiselect: [
        MultiSelect,
        (f, options) => ({
          ...fluid(f),
          ...listed(options),
          pt: { hiddenInput: aria(f) },
          placeholder: f.placeholder ?? 'Select options',
          display: 'chip',
          showToggleAll: false,
        }),
      ],
      autocomplete: [AutocompleteControl, 'options'],
      checkbox: [Checkbox, (f) => ({ ...inner(f), pt: { input: aria(f) }, binary: true })],
      switch: [ToggleSwitch, (f) => ({ ...inner(f), pt: { input: aria(f) } })],
      radio: [RadioButtonGroup, radios],
      scale: [RadioButtonGroup, (f, options) => ({ ...radios(f, options), class: 'scale' })],
      rating: [Rating, (f, options) => ({ stars: options.length, class: { 'rating--invalid': f.invalid } })],
    },
  }),
  file: FileField,
};
