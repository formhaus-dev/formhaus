import type { FieldComponentMap, FieldProps } from '@formhaus/vue';
import { type ControlOption, mapControls } from '@formhaus/vue/controls';
import { h } from 'vue';
import {
  VCheckbox,
  VCombobox,
  VFileInput,
  VRadio,
  VRadioGroup,
  VRating,
  VSelect,
  VSwitch,
  VTextarea,
  VTextField,
} from 'vuetify/components';
import GroupShell from './fields/GroupShell.vue';
import MatrixRow from './fields/MatrixRow.vue';
import OptionTiles from './fields/OptionTiles.vue';

const labels = (f: FieldProps) => ({
  label: f.required ? `${f.label} *` : f.label,
  errorMessages: f.error,
  hint: f.helperText,
  persistentHint: !!f.helperText,
});
const legend = (f: FieldProps) => ({ 'aria-labelledby': `${f.id}-legend` });
const unset = (f: FieldProps) => (f.value === '' || f.value == null ? { modelValue: null } : {});
const items = (f: FieldProps, options: ControlOption[]) => ({ ...unset(f), items: options, itemTitle: 'label', itemValue: 'value' });
const radios = (options: ControlOption[]) => () => options.map((option) => h(VRadio, { label: option.label, value: option.value }));
const cells = (f: FieldProps, options: ControlOption[]) => ({
  inline: true,
  hideDetails: true,
  error: f.invalid,
  'aria-labelledby': `${f.id}-label`,
  'aria-describedby': f.describedBy,
  class: 'matrix-row__group',
  children: () =>
    options.map((option, index) =>
      h(VRadio, {
        value: option.value,
        'aria-label': option.label,
        'data-testid': f.option({ ...option, value: String(option.value) }, index)['data-testid'],
        class: 'matrix-row__cell',
        onBlur: f.blur,
        onFocus: f.focus,
      }),
    ),
});

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { group: GroupShell },
    labels,
    kinds: { multiselect: 'input' },
    freeText: true,
    matrix: mapControls({ shell: MatrixRow, controls: { radio: [VRadioGroup, cells] } }).radio,
    controls: {
      input: VTextField,
      textarea: VTextarea,
      select: [VSelect, items],
      multiselect: [VSelect, (f, options) => ({ ...items(f, options), multiple: true })],
      autocomplete: [VCombobox, (f, options) => ({ ...unset(f), items: options.map((option) => option.label) })],
      checkbox: VCheckbox,
      switch: [VSwitch, () => ({ color: 'primary' })],
      radio: [
        VRadioGroup,
        (f, options) => ({
          ...legend(f),
          hideDetails: true,
          error: f.invalid,
          children: options.some((option) => option.image) ? () => h(OptionTiles, { f }) : radios(options),
        }),
      ],
      scale: [
        VRadioGroup,
        (f, options) => ({ ...legend(f), inline: true, hideDetails: true, error: f.invalid, children: radios(options) }),
      ],
      rating: [
        VRating,
        (f, options) => ({
          length: options.length,
          color: f.invalid ? 'error' : undefined,
          activeColor: 'amber-darken-2',
          density: 'comfortable',
          hover: true,
        }),
      ],
      file: VFileInput,
    },
  }),
};
