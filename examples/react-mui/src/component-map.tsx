import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlOption, mapControls } from '@formhaus/react/controls';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Rating from '@mui/material/Rating';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Fragment } from 'react';
import { AutocompleteField } from './fields/AutocompleteField';
import { MatrixRow } from './fields/MatrixRow';
import { ImageTiles, Segment } from './fields/options';
import { describedBy, FilePicker, FileShell, GroupShell, InlineShell, labels } from './fields/shells';

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
          <Fragment key={option.value}>
            <FormControlLabel
              value={option.value}
              control={<Radio inputProps={{ 'aria-controls': option.reveal?.id }} />}
              label={option.label}
            />
            {option.reveal && (
              <Box
                id={option.reveal.id}
                data-fh="reveal"
                hidden={!option.reveal.open}
                sx={{ ml: 1.25, pl: 2.25, borderLeft: 2, borderColor: 'divider' }}
              >
                {option.reveal.children}
              </Box>
            )}
          </Fragment>
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
    freeText: true,
    conditionalReveal: ['radio'],
    controls: {
      input: TextField,
      textarea: { component: TextField, props: () => ({ multiline: true }) },
      select: { component: TextField, props: (_, options) => ({ select: true, children: menu(options) }) },
      multiselect: {
        component: TextField,
        props: (f, options) => ({
          select: true,
          slotProps: { ...labels(f).slotProps, select: { multiple: true } },
          children: menu(options),
        }),
      },
      checkbox: { component: Checkbox, props: (f) => ({ inputProps: { ...f.aria, 'aria-describedby': describedBy(f) } }) },
      switch: { component: Switch, props: (f) => ({ inputProps: { ...f.aria, 'aria-describedby': describedBy(f) } }) },
      radio: { component: RadioGroup, props: radios },
      scale: { component: RadioGroup, props: (_, options) => ({ row: true, sx: { flexWrap: 'nowrap' }, children: points(options) }) },
      rating: {
        component: Rating,
        props: (_, options) => ({ max: options.length, size: 'large', 'aria-required': undefined, 'aria-invalid': undefined }),
      },
      autocomplete: {
        component: AutocompleteField,
        props: (_, options) => ({ options: options.map((option) => option.label) }),
        changeProp: 'onInputChange',
      },
    },
  }),
  ...mapControls({
    shell: FileShell,
    controls: {
      file: {
        component: FilePicker,
        props: (f, _, { field }) => ({ f, field, 'aria-labelledby': `${f.id}-label ${f.id}-button`, 'aria-describedby': describedBy(f) }),
      },
    },
  }),
};
