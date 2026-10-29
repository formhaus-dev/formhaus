import { type DateType, fromDate, toDate } from '@formhaus/core/fields';
import { type FieldComponentMap, type FieldProps, HiddenField } from '@formhaus/vue';
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
const counted = (f: FieldProps) => (f.maxLength ? { 'aria-describedby': [f.describedBy, `${f.id}-count`].filter(Boolean).join(' ') } : {});
const aria = (f: FieldProps) => ({ ...f.aria, 'data-testid': f.testId });
const inner = (f: FieldProps) => ({ ...root, inputId: f.id, invalid: f.invalid });
const fluid = (f: FieldProps) => ({ ...inner(f), fluid: true });
const text = (f: FieldProps) => ({ ...fluid(f), pt: { pcInputText: { root: aria(f) } } });
const listed = (options: ControlOption[]) => ({ options, optionLabel: 'label', optionValue: 'value' });
const choice = (f: FieldProps, option: ControlOption, index: number) => f.option({ ...option, value: String(option.value) }, index);
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

const cells = (f: FieldProps, options: ControlOption[]) => ({
  ...root,
  role: 'radiogroup',
  'aria-labelledby': `${f.id}-label`,
  'aria-describedby': f.describedBy,
  class: 'matrix__cells',
  children: () =>
    options.map((option, index) =>
      h('span', { key: option.value, class: 'matrix__cell' }, [
        h(RadioButton, {
          inputId: f.optionId(index),
          value: option.value,
          'aria-label': option.label,
          invalid: f.invalid,
          disabled: f.disabled,
          'data-testid': choice(f, option, index)['data-testid'],
          onBlur: f.blur,
          onFocus: f.focus,
        }),
      ]),
    ),
});

const revealed = (option: ControlOption) =>
  option.reveal
    ? h(
        'div',
        { key: option.reveal.id, id: option.reveal.id, 'data-fh': 'reveal', hidden: !option.reveal.open, class: 'reveal' },
        option.reveal.children,
      )
    : [];

const radios = (f: FieldProps, options: ControlOption[]) => ({
  ...root,
  invalid: f.invalid,
  class: ['choices', { 'choices--tiles': options.some((option) => option.image) }],
  children: () =>
    options.flatMap((option, index) => {
      const { id, 'data-testid': testId, onBlur, onFocus } = choice(f, option, index);
      const item = h('label', { key: option.value, for: id, class: 'choice' }, [
        option.image && h('img', { src: option.image, alt: '', class: 'choice__image' }),
        h('span', { class: 'choice__row' }, [
          h(RadioButton, {
            inputId: id,
            value: option.value,
            invalid: f.invalid,
            disabled: f.disabled,
            'data-testid': testId,
            pt: { input: { 'aria-controls': option.reveal?.id } },
            onBlur,
            onFocus,
          }),
          option.label,
        ]),
      ]);
      return [item, revealed(option)];
    }),
});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: FieldShell,
    kinds: { multiselect: 'input' },
    freeText: true,
    conditionalReveal: ['radio'],
    matrix: mapControls({ shell: MatrixRow, controls: { radio: { component: RadioButtonGroup, props: cells } } }).radio,
    controls: {
      input: { component: InputText, props: (f) => ({ ...look(f), ...counted(f) }) },
      password: {
        component: Password,
        props: (f) => ({
          ...fluid(f),
          inputProps: { ...aria(f), ...counted(f), autocomplete: f.attrs.autocomplete },
          feedback: false,
          toggleMask: true,
        }),
      },
      number: {
        component: InputNumber,
        props: (f) => ({
          ...text(f),
          modelValue: typeof f.value === 'number' ? f.value : null,
          useGrouping: false,
          maxFractionDigits: f.inputMode === 'numeric' ? 0 : 4,
        }),
      },
      date: { component: DatePicker, props: picked('date') },
      time: { component: DatePicker, props: picked('time') },
      datetime: { component: DatePicker, props: picked('datetime') },
      textarea: { component: Textarea, props: (f) => ({ ...look(f), ...counted(f), autoResize: true }) },
      select: {
        component: Select,
        props: (f, options) => ({
          ...root,
          ...listed(options),
          labelId: f.id,
          ariaLabelledby: `${f.id}-label`,
          ...look(f),
          pt: { label: aria(f) },
          placeholder: f.placeholder ?? 'Select an option',
          showClear: !f.required,
        }),
      },
      multiselect: {
        component: MultiSelect,
        props: (f, options) => ({
          ...fluid(f),
          ...listed(options),
          pt: { hiddenInput: aria(f) },
          placeholder: f.placeholder ?? 'Select options',
          display: 'chip',
          showToggleAll: false,
        }),
      },
      autocomplete: { component: AutocompleteControl, optionsProp: 'options' },
      checkbox: { component: Checkbox, props: (f) => ({ ...inner(f), pt: { input: aria(f) }, binary: true }) },
      switch: { component: ToggleSwitch, props: (f) => ({ ...inner(f), pt: { input: aria(f) } }) },
      radio: { component: RadioButtonGroup, props: radios },
      scale: {
        component: RadioButtonGroup,
        props: (f, options) => ({ ...radios(f, options), class: ['scale', { 'scale--invalid': f.invalid }] }),
      },
      rating: { component: Rating, props: (f, options) => ({ stars: options.length, class: { 'rating--invalid': f.invalid } }) },
    },
  }),
  file: FileField,
  hidden: HiddenField,
};
