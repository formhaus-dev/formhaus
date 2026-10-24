---
title: "Design systems"
description: "Map a design system to Formhaus with mapControls: one shell for label, helper and error, and one line per field type. Examples for MUI, Ant Design and Vuetify."
---

# Design systems

`mapControls` builds a `components` map from your controls and one shell. Most field types take one line:

::: code-group
```tsx [React]
import { mapControls } from '@formhaus/react/controls'

const components = mapControls({
  shell: Shell,
  controls: {
    input: Input,
    textarea: Textarea,
    select: { component: Select, optionsProp: 'options' },
    checkbox: Checkbox,
    radio: { component: RadioGroup, optionsProp: 'options' },
  },
})

<FormRenderer definition={definition} components={components} onSubmit={handleSubmit} />
```

```ts [Vue]
import { mapControls } from '@formhaus/vue/controls'

const components = mapControls({
  shell: Shell,
  controls: {
    input: VTextField,
    textarea: VTextarea,
    select: { component: VSelect, props: (f, options) => ({ items: options, itemTitle: 'label' }) },
    checkbox: VCheckbox,
  },
})
```
:::

A control is a component, or an object with the component and how to call it. See [Control entries](#control-entries).

The result is a plain `components` map. Mix it with hand-written fields: `{ ...mapControls(config), file: FileField }`. Types you leave out keep the built-in fields in `FormRenderer`.

Call `mapControls` once at module level. Each call creates new components, so a call inside a render function remounts every field and loses focus.

## Kinds

Each type has a kind. The kind decides what the shell renders and how the control gets its value.

| Kind | Types | Shell | Value prop |
|---|---|---|---|
| `input` | `text`, `email`, `phone`, `number`, `password`, `date`, `time`, `datetime`, `textarea`, `select`, `autocomplete`, `file`, custom types | `<label for>` above the control | React `value`, Vue `modelValue` |
| `inline` | `checkbox`, `switch` | `<label for>` after the control | React `checked`, Vue `modelValue` |
| `group` | `radio`, `multiselect`, `scale`, `rating` | `<fieldset>` and `<legend>` | React `value`, Vue `modelValue` |

`kinds` changes the kind of a type. A multiselect drawn as one select box is an `input`: `kinds: { multiselect: 'input' }`.

The `input` key covers `text`, `email`, `phone`, `number`, `password`, `date`, `time` and `datetime`, and only that control gets `type` from `inputType`. A key for one type wins over `input`: `password: Input.Password`.

## Shell

The shell renders the label, the helper and the error around one control. It gets `kind`, `field`, `f` (the object from [field helpers](/guide/custom-fields#field-helpers)), `rootProps`, `anchors` and the control as `children` in React or the default slot in Vue.

```tsx
import type { ControlShellProps } from '@formhaus/react/controls'

export function Shell({ kind, f, rootProps, children }: ControlShellProps) {
  const label = <label htmlFor={f.id}>{f.label}</label>
  const texts = (
    <>
      {f.helperText && <p id={f.helperId}>{f.helperText}</p>}
      {f.error && <p id={f.errorId}>{f.error}</p>}
    </>
  )
  if (kind === 'group')
    return (
      <fieldset {...rootProps}>
        <legend>{f.label}</legend>
        {children}
        {texts}
      </fieldset>
    )
  return (
    <div {...rootProps}>
      {kind === 'input' && label}
      {children}
      {kind === 'inline' && label}
      {texts}
    </div>
  )
}
```

- Spread `rootProps` on the root: `{...rootProps}` in React, `v-bind="rootProps"` in Vue. It carries `data-fh="field"` for [focus](/guide/custom-fields#field-focus), the keyboard handlers of [autoAdvance](#autoadvance), and on a group the test id. A group shell also gets `aria-invalid` and `aria-describedby` for its `<fieldset>`.
- Give the helper the id `f.helperId` and the error the id `f.errorId`. The control points at them with `aria-describedby`.
- In Vue, declare the props with `controlShellProps` from `@formhaus/vue/controls`.
- `anchors` holds the labels of a `scale` at its first, middle and last point, and is empty for other types.

`shell` takes one component, one per kind such as `{ inline: InlineShell, group: GroupShell }`, or `null`. A kind without a shell renders the control in a `<div>` with `rootProps`. The control then gets the props from `labels(f)`, for a component that renders its own label, helper and error:

```tsx
mapControls({
  shell: { input: null, group: GroupShell },
  labels: (f) => ({ label: f.label, error: f.invalid, helperText: f.error ?? f.helperText }),
  controls: { input: TextField },
})
```

Without a shell the control gets no `aria-describedby`: the component links its own helper.

In development, a control with two `<label for>` elements logs a `double-label` warning. Set the shell of that kind to `null`, or do not pass a label to the control.

## Controls

Every control gets these props:

| Prop | Value |
|---|---|
| `id`, `name` | The field id and key. Put `id` on the focusable element |
| `value` or `checked` (React), `modelValue` (Vue) | The value in the shape of the [kind](#kinds): text as a string, `''` when empty, a list for `multiselect`, a boolean for `checkbox` and `switch` |
| `onChange` (React), `onUpdate:modelValue` (Vue) | Saves the value. See below |
| `disabled` | `disabled` or `loading` is set |
| `placeholder`, `inputMode`, `autoComplete` (Vue: `autocomplete`) | From the field, when set, on `input` controls only |
| `aria-invalid`, `aria-required` | While `error` is set, and when `validation.required` is set |
| `aria-describedby` | With a shell, on `input` and `inline` controls |
| `data-testid` | The [test id](/guide/testing) on `input` and `inline` controls, on the root of a group |
| `type` | Only for the `input` key |
| `rows` | From the field, on `textarea` controls |
| `accept` | From the field, on `file` controls |
| `onBlur`, `onFocus` | Report blur and focus |

`onChange` takes what the component sends and writes the value core checks:

- An event: `event.target.value`, `event.target.checked` for `checkbox` and `switch`, the first file of `event.target.files` for `file`. With a second argument, such as MUI `(event, value)`, the second argument.
- A bare value, such as Ant Design `Select`.
- A `File`, or a list of files such as Vuetify `VFileInput` sends: the first file.
- An option object `{ value, label }`, or a list of them: the option values.
- A `Date`, or a date library object with `toDate()` such as dayjs, for `date`, `time` and `datetime`: the [value format](/guide/custom-fields#value-types) of the type.
- For `number`, decimal text becomes a number and empty text `null`. For `scale` and `rating`, text becomes a number, and a `rating` of `0` becomes `null`.

## Control entries

Options are never passed by default. An object entry says where they go and which props the control gets:

```tsx
controls: {
  input: TextField,
  select: { component: Select, optionsProp: 'options' },
  autocomplete: { component: Combobox, optionsProp: 'data' },
  multiselect: { component: Select, optionsProp: 'options', props: () => ({ mode: 'multiple' }) },
  radio: {
    component: RadioGroup,
    props: (f, options) => ({ children: options.map((option) => <Radio key={option.value} {...option} />) }),
  },
  checkbox: { component: Checkbox, changeProp: 'onCheckedChange' },
}
```

| Key | Value |
|---|---|
| `component` | The control component |
| `props` | A function that gets `f` and the options and returns props. Its props override the preset and `optionsProp` |
| `optionsProp` | The name of the prop that gets the options |
| `changeProp` | The name of the prop that reports changes. React uses `onChange` by default, Vue `onUpdate:modelValue`. See [Change prop](#change-prop) |

- `options` are the field options, the matrix columns in a matrix row, or the points of a `scale` or `rating` as `{ value: 3, label: '3' }`.
- In Vue, `children` from `props` becomes the default slot.
- `f.maxLength` and `f.minLength` feed the character counter of a design system, such as Ant Design `showCount`, Element Plus `show-word-limit` or the GOV.UK character count: `textarea: { component: Input.TextArea, props: (f) => ({ showCount: true, maxLength: f.maxLength }) }`. A native `maxLength` stops typing at the limit; leave it out to let the user type on and see the error.

React types `props`, `optionsProp` and `changeProp` with the props of the component, and Vue with its `$props`. A wrong prop name, or a wrong type in a returned prop, fails the type check. Literal unions such as `size: 'large'` are checked as strings.

Inside the `mapControls` call the parameters of `props` get their types. When you declare `controls` in a separate constant, annotate them: `(f: FieldProps, options: ControlOption[]) => ...`. `ControlOption` comes from the `/controls` entry.

### Tuple shorthand

A tuple is short for an object entry: `[component, props or optionsProp, changeProp]`. A string in the second place is `optionsProp`, a function is `props`, and `null` skips it. These entries match the ones above:

```tsx
controls: {
  select: [Select, 'options'],
  multiselect: [Select, (f, options) => ({ options, mode: 'multiple' })],
  checkbox: [Checkbox, null, 'onCheckedChange'],
}
```

The tuple is type checked the same way as the object.

### Change prop

A component that reports changes in another prop names it in `changeProp`. The value then goes through the same `onChange` rules and [autoAdvance](#autoadvance) handling. shadcn/ui, on Radix:

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

const radios = (f: FieldProps, options: ControlOption[]) => ({
  value: f.text,
  children: options.map((option, index) => (
    <div key={option.value} className="flex items-center gap-2">
      <RadioGroupItem id={`${f.id}-${index}`} value={String(option.value)} />
      <Label htmlFor={`${f.id}-${index}`}>{option.label}</Label>
    </div>
  )),
})

const components = mapControls({
  shell: Shell,
  controls: {
    input: Input,
    textarea: Textarea,
    checkbox: { component: Checkbox, changeProp: 'onCheckedChange' },
    switch: { component: Switch, changeProp: 'onCheckedChange' },
    radio: { component: RadioGroup, props: radios, changeProp: 'onValueChange' },
    scale: { component: RadioGroup, props: radios, changeProp: 'onValueChange' },
  },
})
```

Radix compares string values, so `value: f.text` passes a scale point as text. In Vue, `changeProp` names the event listener, such as `'onUpdate:value'`.

### Free text

An autocomplete that takes typed text, such as Mantine `Autocomplete`, needs `freeText`:

```tsx
mapControls({
  shell: Shell,
  freeText: true,
  controls: {
    autocomplete: { component: Autocomplete, props: (_, options) => ({ data: options.map((option) => option.label) }) },
  },
})
```

The control gets the typed text as its value. Text that matches an option label saves the option value, other text saves as typed. With two options of the same label, the first one wins. Without `freeText` the control gets and sends option values, as MUI `Autocomplete`, Ant Design `Select` and Vuetify `VAutocomplete` do.

## Conditional reveal

With [`conditionalReveal`](/guide/conditions#show-a-field-under-its-option) on the renderer, list the types whose `props` draw revealed fields under the options. Each option that `props` gets then has `reveal`: `{ id, open, children }`. Put `children` in a block with that `id` and `data-fh="reveal"` under the option, hide the block while `open` is `false`, and give the option input `aria-controls={option.reveal.id}`. Give a checkbox option `aria-expanded={option.reveal.open}` too.

```tsx
const radios = (f: FieldProps, options: ControlOption[]) => ({
  children: options.map((option) => (
    <Fragment key={option.value}>
      <FormControlLabel value={option.value} label={option.label} control={<Radio inputProps={{ 'aria-controls': option.reveal?.id }} />} />
      {option.reveal && (
        <Box id={option.reveal.id} data-fh="reveal" hidden={!option.reveal.open} sx={{ ml: 1.5, pl: 3, borderLeft: 4, borderColor: 'divider' }}>
          {option.reveal.children}
        </Box>
      )}
    </Fragment>
  )),
})

mapControls({ shell: Shell, conditionalReveal: ['radio'], controls: { radio: { component: RadioGroup, props: radios } } })
```

A type that is not listed keeps the revealed fields after the group, so list a type only when its `props` draw `option.reveal` for every option. A `multiselect` drawn as a dropdown cannot show fields under an option. The revealed fields sit inside the option group of the design system, so keep them out of its group context: a nested checkbox must not join a parent checkbox group, and a `<fieldset disabled>` around the options disables them too. Keys and clicks from the revealed fields do not trigger the [autoAdvance](#autoadvance) wiring of the parent, as long as the block has `data-fh="reveal"`.

## autoAdvance

For `radio`, `scale` and `rating` with `autoAdvance`, `rootProps` wire the same keys as the built-in fields: a click, Enter or Space commits the pick and goes to the next step, arrow keys, Home and End only change the value. A held Space commits once on release. Native radios work as they are, and so do components that pick an option on focus or on their own Space or Enter handler, such as Radix: each press commits once. Clicks, Space and Enter commit only on an option: a native radio, an element with `role="radio"` or `role="option"`, or a button with a `value`. A clear button or a text input inside the group keeps its own keys and does not commit. See [autoAdvance](/guide/custom-fields#autoadvance).

## MUI

```tsx
import type { FieldComponentMap, FieldProps } from '@formhaus/react'
import { type ControlOption, mapControls } from '@formhaus/react/controls'
import { Checkbox, FormControlLabel, MenuItem, Radio, RadioGroup, Rating, Switch, TextField } from '@mui/material'

const labels = (f: FieldProps) => ({
  label: f.label,
  required: f.required,
  error: f.invalid,
  helperText: f.error ?? f.helperText,
  fullWidth: true,
  margin: 'normal',
  'data-testid': undefined,
  slotProps: {
    inputLabel: { shrink: f.inputType.includes('date') || f.inputType === 'time' || undefined },
    htmlInput: { 'data-testid': f.testId },
  },
})

const menu = (options: ControlOption[]) =>
  options.map((option) => (
    <MenuItem key={option.value} value={option.value}>
      {option.label}
    </MenuItem>
  ))

const radios = (options: ControlOption[]) =>
  options.map((option) => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />)

export const components: FieldComponentMap = {
  ...mapControls({
    shell: { input: null, inline: InlineShell, group: GroupShell },
    labels,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: TextField,
      textarea: { component: TextField, props: () => ({ multiline: true, minRows: 3 }) },
      select: { component: TextField, props: (_, options) => ({ select: true, children: menu(options) }) },
      multiselect: {
        component: TextField,
        props: (_, options) => ({ select: true, slotProps: { select: { multiple: true } }, children: menu(options) }),
      },
      checkbox: { component: Checkbox, props: (f) => ({ inputProps: f.aria }) },
      switch: { component: Switch, props: (f) => ({ inputProps: f.aria }) },
      radio: { component: RadioGroup, props: (_, options) => ({ children: radios(options) }) },
      scale: { component: RadioGroup, props: (_, options) => ({ row: true, children: radios(options) }) },
      rating: { component: Rating, props: (_, options) => ({ max: options.length }) },
    },
  }),
  autocomplete: AutocompleteField,
  file: FileField,
}
```

`TextField` renders its own label, helper and error, so the `input` kind has no shell. It puts unknown props such as `data-testid` on its root, so `labels` moves the [test id](/guide/testing) to the input with `slotProps.htmlInput`. MUI `Checkbox` and `Switch` put unknown props on their root, so `inputProps` moves the ARIA to the input. The shells use `FormControl`:

```tsx
import type { ControlShellProps } from '@formhaus/react/controls'
import { Box, FormControl, FormControlLabel, FormHelperText, FormLabel, Typography } from '@mui/material'
import type { ReactElement } from 'react'

function Texts({ f }: Pick<ControlShellProps, 'f'>) {
  return (
    <>
      {f.helperText && <FormHelperText id={f.helperId}>{f.helperText}</FormHelperText>}
      {f.error && <FormHelperText id={f.errorId}>{f.error}</FormHelperText>}
    </>
  )
}

export function InlineShell({ f, rootProps, children }: ControlShellProps) {
  return (
    <FormControl {...rootProps} error={f.invalid}>
      <FormControlLabel control={children as ReactElement} label={f.label} required={f.required} />
      <Texts f={f} />
    </FormControl>
  )
}

export function GroupShell({ f, rootProps, anchors, children }: ControlShellProps) {
  return (
    <FormControl {...rootProps} component="fieldset" error={f.invalid} fullWidth>
      <FormLabel component="legend" required={f.required}>
        {f.label}
      </FormLabel>
      {children}
      {anchors.some(Boolean) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {anchors.map((anchor, index) => (
            <Typography key={index} variant="caption">
              {anchor?.label}
            </Typography>
          ))}
        </Box>
      )}
      <Texts f={f} />
    </FormControl>
  )
}
```

## Ant Design

```tsx
import { toDate } from '@formhaus/core/fields'
import type { FieldComponentMap, FieldProps } from '@formhaus/react'
import { mapControls } from '@formhaus/react/controls'
import { Checkbox, DatePicker, Input, InputNumber, Radio, Rate, Select, Switch, TimePicker } from 'antd'
import dayjs from 'dayjs'

const picked = (f: FieldProps) => {
  const date = toDate(f.value)
  return { value: date && dayjs(date), style: { width: '100%' } }
}

export const components: FieldComponentMap = {
  ...mapControls({
    shell: Shell,
    kinds: { multiselect: 'input' },
    matrix: MatrixRow,
    controls: {
      input: Input,
      password: Input.Password,
      number: { component: InputNumber, props: () => ({ style: { width: '100%' } }) },
      textarea: { component: Input.TextArea, props: () => ({ rows: 4 }) },
      select: { component: Select, optionsProp: 'options' },
      multiselect: { component: Select, optionsProp: 'options', props: () => ({ mode: 'multiple' }) },
      autocomplete: { component: Select, optionsProp: 'options', props: () => ({ showSearch: { optionFilterProp: 'label' } }) },
      date: { component: DatePicker, props: picked },
      datetime: {
        component: DatePicker,
        props: (f) => ({ ...picked(f), showTime: { format: 'HH:mm' }, format: 'YYYY-MM-DD HH:mm' }),
      },
      time: { component: TimePicker, props: (f) => ({ ...picked(f), format: 'HH:mm' }) },
      checkbox: Checkbox,
      switch: Switch,
      radio: { component: Radio.Group, optionsProp: 'options', props: () => ({ vertical: true }) },
      scale: {
        component: Radio.Group,
        optionsProp: 'options',
        props: () => ({ optionType: 'button', buttonStyle: 'solid', block: true }),
      },
      rating: { component: Rate, props: (_, options) => ({ count: options.length }) },
    },
  }),
  file: FileField,
}
```

The pickers send a dayjs object, which `onChange` writes as the value of the type. The shell wraps `Form.Item`; a group gets a `<fieldset>`:

```tsx
import type { ControlShellProps } from '@formhaus/react/controls'
import { Form, Typography } from 'antd'

export function Shell({ kind, f, rootProps, anchors, children }: ControlShellProps) {
  const help = (f.helperText || f.error) && (
    <>
      {f.helperText && <div id={f.helperId}>{f.helperText}</div>}
      {f.error && <div id={f.errorId}>{f.error}</div>}
    </>
  )
  const item = (
    <Form.Item
      label={kind === 'input' ? f.label : undefined}
      htmlFor={f.id}
      required={f.required}
      validateStatus={f.invalid ? 'error' : undefined}
      help={help}
    >
      {kind === 'inline' ? (
        <span className="inline-label">
          {children}
          <label htmlFor={f.id}>{f.label}</label>
        </span>
      ) : (
        children
      )}
      {anchors.some(Boolean) && (
        <div className="scale-anchors">
          {anchors.map((anchor, index) => (
            <Typography.Text key={index} type="secondary">
              {anchor?.label}
            </Typography.Text>
          ))}
        </div>
      )}
    </Form.Item>
  )
  return kind === 'group' ? (
    <fieldset {...rootProps} className="choice-group">
      <legend>
        {f.label}
        {f.required && <span aria-hidden="true"> *</span>}
      </legend>
      {item}
    </fieldset>
  ) : (
    <div {...rootProps}>{item}</div>
  )
}
```

## Vuetify

```ts
import type { FieldComponentMap, FieldProps } from '@formhaus/vue'
import { type ControlOption, mapControls } from '@formhaus/vue/controls'
import { h } from 'vue'
import { VAutocomplete, VCheckbox, VFileInput, VRadio, VRadioGroup, VRating, VSelect, VSwitch, VTextarea, VTextField } from 'vuetify/components'

const labels = (f: FieldProps) => ({ label: f.label, errorMessages: f.error, hint: f.helperText, persistentHint: !!f.helperText })
const items = (_: FieldProps, options: ControlOption[]) => ({ items: options, itemTitle: 'label', itemValue: 'value' })
const radios = (options: ControlOption[]) => () => options.map((option) => h(VRadio, { label: option.label, value: option.value }))

export const components: FieldComponentMap = mapControls({
  shell: { group: GroupShell },
  labels,
  kinds: { multiselect: 'input' },
  matrix: MatrixRow,
  controls: {
    input: VTextField,
    textarea: VTextarea,
    select: { component: VSelect, props: items },
    multiselect: { component: VSelect, props: (f, options) => ({ ...items(f, options), multiple: true }) },
    autocomplete: { component: VAutocomplete, props: items },
    checkbox: VCheckbox,
    switch: { component: VSwitch, props: () => ({ color: 'primary' }) },
    file: VFileInput,
    radio: { component: VRadioGroup, props: (_, options) => ({ hideDetails: true, children: radios(options) }) },
    scale: { component: VRadioGroup, props: (_, options) => ({ inline: true, hideDetails: true, children: radios(options) }) },
    rating: { component: VRating, props: (_, options) => ({ length: options.length, hover: true }) },
  },
})
```

Vuetify inputs render their own label and messages, so only groups have a shell:

```vue
<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls'

const props = defineProps(controlShellProps)
</script>

<template>
  <fieldset v-bind="props.rootProps" class="group">
    <legend class="text-body-1">
      {{ props.f.label }}<span v-if="props.f.required" aria-hidden="true"> *</span>
    </legend>
    <slot />
    <div v-if="props.anchors.some(Boolean)" class="group__anchors text-caption">
      <span v-for="(anchor, index) in props.anchors" :key="index">{{ anchor?.label }}</span>
    </div>
    <div v-if="props.f.helperText" :id="props.f.helperId" class="text-caption">{{ props.f.helperText }}</div>
    <div v-if="props.f.error" :id="props.f.errorId" class="text-caption text-error">{{ props.f.error }}</div>
  </fieldset>
</template>
```

## What stays custom

- Matrix rows. Pass their component as `matrix`: rows in a [matrix section](/guide/sections#matrix) render it instead of the mapped control. Draw the column headers in a [`layout.section`](/guide/custom-fields#matrix-rows).
- Fields with more than one control, such as a file picker with a button and a list, or MUI `Autocomplete` with `renderInput`. Write them with the [field helpers](/guide/custom-fields#field-helpers) and add them next to the map.
- `hidden`: the built-in field renders no markup.
