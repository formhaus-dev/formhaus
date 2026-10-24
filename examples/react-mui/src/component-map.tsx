import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Rating from '@mui/material/Rating';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { AutocompleteField } from './fields/AutocompleteField';
import { FileField } from './fields/FileField';
import { MatrixRow } from './fields/MatrixRow';
import { ImageTiles, Segment } from './fields/options';
import { GroupShell, InlineShell, labels } from './fields/shells';

const menu = (options: ControlOption[]) =>
  options.map((option) => (
    <MenuItem key={option.value} value={option.value}>
      {option.label}
    </MenuItem>
  ));

const radios = (f: FieldProps, options: ControlOption[]) =>
  options.some((option) => option.image)
    ? { sx: { display: 'block' }, children: <ImageTiles options={options} value={f.value} /> }
    : {
        children: options.map((option) => (
          <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
        )),
      };

const points = (options: ControlOption[]) =>
  options.map((option) => (
    <Radio
      key={option.value}
      value={option.value}
      icon={<Segment label={option.label} />}
      checkedIcon={<Segment label={option.label} checked />}
      inputProps={{ 'aria-label': option.label }}
      disableRipple
      sx={{ flex: 1, p: 0, borderRadius: 0, '& + &': { ml: '-1px' } }}
    />
  ));

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: InlineShell, group: GroupShell },
    labels,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: TextField,
      textarea: [TextField, () => ({ multiline: true, minRows: 3 })],
      select: [TextField, (_, options) => ({ select: true, children: menu(options) })],
      multiselect: [
        TextField,
        (f, options) => ({ select: true, slotProps: { ...labels(f).slotProps, select: { multiple: true } }, children: menu(options) }),
      ],
      checkbox: [Checkbox, (f) => ({ inputProps: f.aria })],
      switch: [Switch, (f) => ({ inputProps: f.aria })],
      radio: [RadioGroup, radios],
      scale: [RadioGroup, (_, options) => ({ row: true, sx: { flexWrap: 'nowrap' }, children: points(options) })],
      rating: [Rating, (_, options) => ({ max: options.length, size: 'large' })],
    },
  }),
  autocomplete: AutocompleteField,
  file: FileField,
};
