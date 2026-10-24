import type { FieldComponentMap, FieldProps } from '@formhaus/vue';
import { type ControlOption, mapControls } from '@formhaus/vue/controls';
import { h } from 'vue';
import { VAutocomplete, VCheckbox, VRadio, VRadioGroup, VRating, VSelect, VSwitch, VTextarea, VTextField } from 'vuetify/components';
import FileField from './fields/FileField.vue';
import GroupShell from './fields/GroupShell.vue';
import MatrixRow from './fields/MatrixRow.vue';
import OptionTiles from './fields/OptionTiles.vue';

const star = 'svg:M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z';
const starOutline =
  'svg:M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z';

const labels = (f: FieldProps) => ({ label: f.label, errorMessages: f.error, hint: f.helperText, persistentHint: !!f.helperText });
const items = (_: FieldProps, options: ControlOption[]) => ({ items: options, itemTitle: 'label', itemValue: 'value' });
const radios = (options: ControlOption[]) => () => options.map((option) => h(VRadio, { label: option.label, value: option.value }));

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { group: GroupShell },
    labels,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: VTextField,
      textarea: [VTextarea, () => ({ rows: 3 })],
      select: [VSelect, items],
      multiselect: [VSelect, (f, options) => ({ ...items(f, options), multiple: true })],
      autocomplete: [VAutocomplete, items],
      checkbox: VCheckbox,
      switch: [VSwitch, () => ({ color: 'primary' })],
      radio: [
        VRadioGroup,
        (f, options) => ({
          hideDetails: true,
          error: f.invalid,
          children: options.some((option) => option.image) ? () => h(OptionTiles, { f }) : radios(options),
        }),
      ],
      scale: [VRadioGroup, (f, options) => ({ inline: true, hideDetails: true, error: f.invalid, children: radios(options) })],
      rating: [
        VRating,
        (f, options) => ({
          length: options.length,
          color: f.invalid ? 'error' : undefined,
          fullIcon: star,
          emptyIcon: starOutline,
          activeColor: 'amber-darken-2',
          density: 'comfortable',
          hover: true,
        }),
      ],
    },
  }),
  file: FileField,
};
