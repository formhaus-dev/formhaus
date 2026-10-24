---
title: "Custom field components"
description: "The contract of a custom Formhaus field in React and Vue, the field helpers that follow it, value types and layout slots."
---

# Custom Fields

A custom field component replaces the whole field. Map it by type in `components`:

::: code-group
```vue [Vue]
<FormRenderer :definition="definition" :components="{ 'x-choice': ChoiceButtons }" @submit="onSubmit" />
```

```tsx [React]
<FormRenderer definition={definition} components={{ 'x-choice': ChoiceButtons }} onSubmit={handleSubmit} />
```
:::

The same map overrides a built-in type, such as `{ date: MyDatePicker }`. See [Custom field types](/guide/fields#custom-field-types) for naming and `props`.

Field types go in `components`. Sections, groups, the error summary, the progress, the buttons and every other part around the fields go in [`layout`](#layout-slots). `components.section`, `components.group`, `components.groupItem` and `components.confirmDialog` still work, and warn once in development with the code `legacy-layout`.

To plug in a whole design system, start with [Design systems](/guide/design-systems): `mapControls` maps one control per type and one shell for the label, helper and error.

Before you write a component, read [Value types](#value-types): each built-in type expects one value shape, and a `scale` reads its points from `validation`, not from `options`. See [Scale](#scale).

## Field helpers

`fieldProps(props)` in React and `useFieldProps(props, emit)` in Vue return everything a field needs from the [contract](#contract): ids, ARIA, flags, the value and the handlers. A text field is then a few lines:

::: code-group
<<< @/recipes/snippets/text-input.vue [Vue]

<<< @/recipes/snippets/field-helpers.tsx [React]
:::

| Key | Meaning |
|---|---|
| `id`, `name` | The element id, which is the `id` prop or a default from the key, and the field key |
| `label`, `helperText`, `error`, `placeholder` | The texts to show. `placeholder` falls back to `mask` |
| `helperId`, `errorId` | `` `${id}-helper` `` and `` `${id}-error` `` |
| `describedBy` | The helper id and then the error id, only the ones shown |
| `invalid`, `required`, `disabled` | `error` is set, `validation.required` is set, `disabled` or `loading` is set |
| `inputType`, `inputMode` | The `type` of a native input for the field type (`text`, `email`, `tel`, `number`, `password`, `date`, `time` or `datetime-local`), and `field.inputMode` |
| `aria` | `aria-invalid`, `aria-required` and `aria-describedby`, for a control or group whose helper and error you render |
| `testId` | The [test id](/guide/testing) of the field |
| `value`, `text` | The value, and the value as a string with `''` for `null` |
| `change(value)` | Saves a value. For `number`, decimal text becomes a number, empty text becomes `null`, other text stays a string |
| `onInput(event)` | `change` with the value of an input event |
| `commit(value)` | A discrete pick: commits with [autoAdvance](#autoadvance), else saves |
| `blur()`, `focus()` | Report blur and focus |
| `options` | `matrix.columns` in a [matrix row](#matrix-rows), else `field.options` |
| `option(option, index)` | `id`, `name`, `value`, `checked`, `disabled`, `data-testid` and the blur and focus handlers of one radio or checkbox. The first option gets `id`, the others `` `${id}-${index}` `` |
| `attrs` | For a native control whose helper and error you render: `id`, `name`, `disabled`, `placeholder`, `inputMode`, `autoComplete` (Vue: `autocomplete`), `data-testid`, `aria` and the blur and focus handlers |
| `input` | For a component that renders its own label, helper and error: `attrs` without `aria-describedby` and `data-testid`, plus the value. Keep `aria-invalid` in the DOM: focus after a failed Continue or Submit looks for it. React: `value` and `onChange(event)`. Vue: `modelValue` and `onUpdate:modelValue`, for `v-model` |

In Vue, `f` is a reactive object: `f.change` works in the script and in the template. Do not destructure it.

Map the keys to the props of your design system. A component library renders the helper and error itself and links them with its own ids, so pass it `input`, which leaves out `aria-describedby`. MUI `TextField` puts unknown props on its root element, so the test id goes to the inner input through `slotProps.htmlInput`:

```tsx
<TextField
  {...f.input}
  type={f.inputType}
  label={f.label}
  error={f.invalid}
  helperText={f.error ?? f.helperText}
  slotProps={{ htmlInput: { 'data-testid': f.testId } }}
/>
```

With Vuetify: `<v-text-field v-bind="f.input" :type="f.inputType" :label="f.label" :error-messages="f.error" :hint="f.helperText" persistent-hint />`.

`@formhaus/core/fields` has the helpers both wrappers use, for any framework:

| Helper | Returns |
|---|---|
| `fieldState({ id, field, error, disabled, loading })` | The ids, texts, flags and `aria` above |
| `fieldId({ id, field })`, `fieldAria({ id, field, error })` | Only the id, only the ARIA attributes |
| `fieldValue(field, value)`, `numberValue(text)` | The value core accepts for the field. `numberValue` follows the decimal rule of core: `0x10` stays text |
| `inputType(field)`, `optionChecked(value, option)` | The native input type, and whether an option is picked in a single or list value |
| `fromDate(date, type)`, `toDate(value)` | A `date`, `datetime` or `time` value from a `Date`, and a `Date` from such a value. See [Value types](#value-types) |
| `scaleView(field)` | The points, `min`, `max` and the start, middle and end anchors of a `scale` or `rating`. See [Scale](#scale) |
| `optionText(options, value)`, `optionValue(options, text)` | The text an `autocomplete` shows for a value, and the value for a typed text |
| `toggleOption(value, option)` | A `multiselect` value with the option added or removed |

## Contract

The helpers above follow these rules. A component without them follows the rules itself.

- The component renders its own label, helper text and error message. The renderer adds no wrapper around it.
- Put the `id` prop on the focusable control. The error summary links to it, and focus after a failed Continue or Submit looks it up. See [Ids and ARIA](#ids-and-aria) and [Field focus](#field-focus).
- Give the error message the `id` plus `-error` as its id, and set `aria-invalid` on the control while `error` is set.
- Emit every change: `onChange(value)` in React, `update:modelValue` in Vue.
- When `field.autoAdvance` is set, a discrete pick emits `commit` instead of a change. See [autoAdvance](#autoadvance).
- Call `onBlur` and `onFocus` (React) or emit `blur` and `focus` (Vue). They report `field_focused` and `field_blurred` [form events](/guide/custom-components#form-events).
- Disable the control while `disabled` or `loading` is set.

| Prop | React | Vue |
|---|---|---|
| Element id | `id` | `id` |
| Field from the definition | `field` | `field` |
| Current value | `value` | `modelValue` |
| Error message | `error` | `error` |
| Loading state from `FormEngine.setFieldLoading()` or a running `optionsFrom` provider | `loading` | `loading` |
| Form is busy or disabled | `disabled` | `disabled` |
| [Test ids](/guide/testing) | `testId`, `optionTestId` | `testId`, `optionTestId` |
| Change | `onChange(value)` | `update:modelValue` |
| Discrete pick with `autoAdvance` | `onCommit(value)`, optional | `commit` |
| Blur and focus | `onBlur()`, `onFocus()` | `blur`, `focus` |
| [Matrix row](#matrix-rows) context | `matrix` | `matrix` |
| [Revealed fields](/guide/conditions#show-a-field-under-its-option) of the options, built-in and `mapControls` fields only | `reveals` | `reveals` |

### autoAdvance

A field with `"autoAdvance": true` goes to the next step when the user picks an answer. A custom choice, scale or rating must then send the pick with `f.commit(value)`. Without the helpers, call `onCommit(value)` in React or `emit('commit', value)` in Vue. `onChange` and `update:modelValue` only save the value, so with them the step never advances. `commit` saves the value too: do not also emit a change for that pick. Typing, arrow keys and other edits still emit a change.

::: code-group
<<< @/recipes/snippets/choice-buttons.vue [Vue]

```ts [React without helpers]
const pick = (value: string) => {
  if (field.autoAdvance && onCommit) onCommit(value)
  else onChange(value)
}
```
:::

`ChoiceButtons` in the React tab of [Field helpers](#field-helpers) is the same field in React. Without the helpers in Vue, keep the two `emit` calls apart: `emit(field.autoAdvance ? 'commit' : 'update:modelValue', value)` fails `vue-tsc`, because each event has its own signature.

### Ids and ARIA

The renderer always passes `id`. It is optional in the type only so that you can render the component on its own. `fieldId` then falls back to an id from the key. The built-in fields use these ids:

| Element | Id or attribute |
|---|---|
| Focusable control, or the group of a choice field | `id` |
| Helper text | `` `${id}-helper` `` |
| Error message | `` `${id}-error` `` |
| Control | `aria-describedby` with the helper id and then the error id, only the ones shown |
| Control | `aria-invalid="true"` while `error` is set |
| Control | `aria-required="true"` when `field.validation.required` is set |
| Root of a choice field | a `<fieldset>` with a `<legend>`, or `role="group"` with `aria-labelledby` |

### Field focus

Focus finds the controls of a field by the `id` and by `data-fh` attributes:

- The element with the `id` gets focus. When it is not an `input`, `select`, `textarea`, `button` or an element with `tabindex`, focus goes to the first of those inside it. Focus skips `tabindex="-1"` and `aria-disabled="true"`.
- Put `data-fh="field"` on the root of a field. For a radio, scale or rating, focus then goes to the checked option. Without it, and with the `id` on the first option, focus always lands on the first option.
- When only the error message carries the id (`id` plus `-error`), `data-fh="field"` on the root lets focus find the control.
- A file field whose native input is hidden with `tabindex="-1"` must put the `id` on the visible button, or mark the root with `data-fh="field"` so that focus finds the button.
- In a custom `group`, mark the group root with `data-fh="group"`, each item with `data-fh-group-item` and the Add button with `data-fh-group-add`. See [Groups: Custom markup](/guide/groups#custom-markup).

## Value types

A component for a built-in type writes the value that core checks for that type. A value of another shape fails validation.

| Type | Value |
|---|---|
| `text`, `email`, `phone`, `password`, `textarea`, `hidden` | string |
| `autocomplete` | string: the option `value` when the text matches an option `label`, else the text as typed. `optionText` and `optionValue` map between them |
| `number` | finite number, or `null` when cleared |
| `select`, `radio` | string, the option `value` |
| `multiselect` | string[] of distinct option values. `toggleOption` adds or removes one |
| `checkbox`, `switch` | boolean |
| `date` | string `YYYY-MM-DD` |
| `datetime` | string `YYYY-MM-DDTHH:mm`. Core also accepts seconds, milliseconds and a `Z` or `+HH:mm` offset, such as `2026-01-05T09:07:30.5+02:00` |
| `time` | string `HH:mm`, 24-hour, or `HH:mm:ss` |
| `scale`, `rating` | number, the selected point |
| `file` | one `File`, or `null` |
| custom type | string, number or boolean |

A `file` field holds one file. Use one `file` field per file.

Write `null` or `''` when the user clears the control. An empty value is checked only against `required` and `matchField`.

For `number`, `change` and the built-in field write `null` when the input is empty. With `change`, text that is not a number stays a string, and validation fails with the `number` message rather than `required`. A browser number input reports an empty value for such text, so it becomes `null`. Never write `NaN`.

A composite control, such as a date picker and a time picker side by side for one `datetime`, writes one value. Write `null` until both parts are set: the field then fails only `required`. A partial string, such as `2026-01-05T`, fails the format check and shows the `datetime` message. Pick one of the two and keep it.

Date pickers usually work with `Date` objects. `fromDate(date, field.type)` writes the value in local time, as `YYYY-MM-DD`, `YYYY-MM-DDTHH:mm` or `HH:mm`. `toDate(value)` reads every format core accepts:

```ts
import { fromDate, toDate } from '@formhaus/core/fields'

fromDate(new Date(2026, 0, 5, 9, 7), 'datetime') // '2026-01-05T09:07'
toDate('2026-01-05T09:07') // 5 January 2026, 09:07 local time
toDate('2026-01-05T09:07Z') // the same instant in every time zone
toDate('09:07') // 1 January 1970, 09:07 local time
toDate('2026-02-31') // null
```

- A value without `Z` or an offset is local time. A value with one is that instant.
- An impossible date, such as `2026-02-31`, gives `null`. Core accepts such a date as a format, so check it in the component when it matters.
- A local time that does not exist, such as 02:30 on the night clocks move forward, moves forward like `new Date()`: `toDate('2026-03-08T02:30')` in New York is 03:30.

## Scale

A component for `scale` or `rating` reads its range and anchor labels from the field:

- The points run from `validation.min` to `validation.max`. They default to 1 and 5. A range has at most 11 points. `rating` always starts at 1.
- The value is the point as a number, such as `7`. A string such as `"7"` fails validation.
- `options` are not the points. They are optional anchor labels for some points, and an option `value` is the point as a string, such as `"0"` or `"10"`. The built-in scale shows the labels of the first point, the middle point `floor((min + max) / 2)` and the last point.

`scaleView(field)` from `@formhaus/core/fields` applies these rules:

```ts
import { scaleView } from '@formhaus/core/fields'

const { points, min, max, anchors } = scaleView(field)
// points: [0, 1, ..., 10]
// anchors: [{ point: 0, label: 'Not likely' }, undefined, { point: 10, label: 'Very likely' }]
```

Pick a point with `f.commit(point)`, as a number, so that [autoAdvance](#autoadvance) works. See [Scale](/guide/fields#scale) and [Rating](/guide/fields#rating).

## Layout slots

`layout` replaces the parts of the form around the fields. A key you leave out keeps the built-in markup.

::: code-group
```vue [Vue]
<FormRenderer :definition="definition" :components="fields" :layout="{ section: MySection, errorSummary: MySummary }" @submit="onSubmit" />
```

```tsx [React]
<FormRenderer definition={definition} components={fields} layout={{ section: MySection, errorSummary: MySummary }} onSubmit={handleSubmit} />
```
:::

| Key | Renders | React props | Vue props |
|---|---|---|---|
| `fields` | The container around the fields | `FieldsContainerProps` | `fieldsContainerProps` |
| `section` | A [section](/guide/sections) | `SectionComponentProps` | `sectionComponentProps` |
| `group` | A [repeatable group](/guide/groups) | `GroupComponentProps` | `groupComponentProps` |
| `groupItem` | One item of a group | `GroupItemComponentProps` | `groupItemComponentProps` |
| `confirmDialog` | The dialog before an item with answers is removed | `ConfirmDialogComponentProps` | `confirmDialogComponentProps` |
| `errorSummary` | The [error summary](/guide/errors) | `ErrorSummaryComponentProps` | `errorSummaryComponentProps` |
| `formErrors` | Errors that belong to no field | `FormErrorsComponentProps` | `formErrorsComponentProps` |
| `progress` | The [step progress](/guide/custom-components#custom-progress-component) | `FormStepProgressProps` | `formStepProgressProps` |
| `actions` | The [buttons](/guide/custom-components#custom-actions-component) | `FormActionsProps` | `formActionsProps` |

`LayoutComponentMap` types the whole map. Every slot gets the values the field components need from [Value types](#value-types): the slots only place the fields, they never change the values.

The `<form class="fh-form">` element stays. Add a design-system class to it with `className` in React. In Vue, `class` and other attributes on `FormRenderer` or `HeadlessFormRenderer` fall through to the `<form>`.

::: code-group
```vue [Vue]
<FormRenderer class="usa-form" :definition="definition" @submit="onSubmit" />
```

```tsx [React]
<FormRenderer className="usa-form" definition={definition} onSubmit={handleSubmit} />
```
:::

`components.section`, `components.group`, `components.groupItem`, `components.confirmDialog`, `actionsComponent` and `progressComponent` keep working until 2.0. `layout` wins when both are set. In development the renderer warns once per old key with the code `legacy-layout`.

### Slot props

| Slot | Props | `rootProps` |
|---|---|---|
| `fields` | `rootProps`. The fields come as `children` in React and as the default slot in Vue | yes |
| `section` | `id`, `section`, `title`, `description`, `descriptionId`, `columns`. The fields come as `children` in React and as the default slot in Vue | no |
| `group` | The group texts, `items`, `canAdd`, `add`, `remove(id)`, `requestRemove(id)`, `addLabel`, `removeLabel`, `status`, `disabled`, `itemComponent` | no |
| `groupItem` | `id`, `index`, `title`, `titleId`, `canRemove`, `remove`, `requestRemove`, `hasContent`, `removeLabel`, `removeName`, `disabled`. The fields come as `children` in React and as the `fields` component in Vue | no |
| `confirmDialog` | `id`, `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `confirm()`, `cancel()` | no |
| `errorSummary` | `rootProps`, `title`, `groups`, `count`, `showField(key)` | yes |
| `formErrors` | `rootProps`, `errors` | yes |
| `progress` | `current`, `total`, `stepTitle`, `stepDescription`, `headingLevel`, `counterLabel`, `stepErrorCount`, `stepErrorsLabel`, `steps`, `marks`, `rootProps` | yes |
| `actions` | The props in [Custom Actions & Progress](/guide/custom-components#custom-actions-component), plus `primaryDisabled` and `rootProps` | yes |

- `fields`: without it the fields sit in a plain `<div>` with no spacing. A headless integration usually passes `layout.fields` with the stack or grid of its design system. The progress comes before the fields, and the error summary after them unless `errorSummary` is `"top"`.
- `section`: each child stays wrapped in the renderer component that keeps its value and errors current, so count fields with `section.fields`, not with the children. In a matrix section, `columns` holds the column options, and each row gets `matrix`. In any other section `columns` is `undefined`. A `components.section` gets no `columns`. See [Matrix rows](#matrix-rows).
- `group`: render each item with `itemComponent`.
- `groupItem`: in Vue, render the fields with `<component :is="fields" />`.
- `confirmDialog`: opens only for an item with answers. See [Remove dialog](#remove-dialog).
- `errorSummary`: `title` is the `errorSummary` [label](/guide/translations). Change it with `labels: { errorSummary: 'There is a problem' }` on the renderer. `groups` has one `{ id, title, entries }` per step with errors, and each entry is `{ key, id, text, message }` with the DOM id of the field. `text` is `Label: message` and `message` is the field message alone, the same text as the error under the field. `showField` opens the step of the field and focuses it. The summary renders when the `errorSummary` prop is not `false` and `count` is above 0. With `errorSummary="top"` it renders first in the form, before the progress and the fields. After a failed Continue or Submit, the summary takes focus only when it lists two or more errors. With one error, focus goes to the invalid field. See [Error summary and step marks](/guide/errors#error-summary-and-step-marks).
- `formErrors`: `errors` holds the `formErrors` of a `{ ok: false }` [submit result](/guide/errors) and the message of a failed action. It renders when `errors` is not empty.
- `progress`: renders only for a multi-step form. `steps` always holds every step of the active path as `{ id, title, errorCount, errorsLabel }`. `marks` is `true` only when the renderer has `stepErrorMarks`, so draw the step list when `marks` is `true`. `stepErrorsLabel` and each `errorsLabel` are the `stepErrors` [label](/guide/translations), such as `Errors: 2`, and are `undefined` when the step has no errors.
- `actions`: `primaryDisabled` is `true` while the `disabled` conditions of the primary action match, the `next` of the step or the form `submit` on the last step. Disable the primary button while `primaryDisabled` or `loading` is set. See [Custom progress component](/guide/custom-components#custom-progress-component).

### Root props

`rootProps` carries the attributes that focus and screen readers depend on. Spread it on the root element: `{...rootProps}` in React, `v-bind="rootProps"` in Vue. A Vue component must declare `rootProps`, for example with the exported props object, or the object falls through as an attribute and focus does not find the root.

| Slot | `rootProps` |
|---|---|
| `fields` | `{ 'data-fh': 'fields' }` |
| `errorSummary` | `{ 'data-fh': 'error-summary', role: 'alert', tabIndex: -1 }` |
| `formErrors` | `{ 'data-fh': 'form-errors', role: 'alert' }` |
| `progress` | `{ 'data-fh': 'progress' }` |
| `actions` | `{ 'data-fh': 'actions' }` |

`RootProps` is the type. When the renderer has [`testIds`](/guide/testing), the `rootProps` of `errorSummary` also carry its `data-testid`.

Put `rootProps` on one element, and keep one `role="alert"`. Some components type their own `role` prop, such as Carbon notifications, and reject the `role` of `rootProps`. Spread `rootProps` on a wrapper element then. Some design-system alerts put their attributes on an inner element or on a `Transition`, and some set their own `role="alert"`. Then wrap the component in an element that takes `rootProps`, and turn off the role of the inner component if it has an option for that. With a pass-through option, such as `pt: { root: rootProps }` in PrimeVue, the component can take `rootProps` itself.

An error summary in React:

```tsx
import type { ErrorSummaryComponentProps } from '@formhaus/react'

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <div {...rootProps} className="my-summary">
      <strong>{title}</strong>
      <ul>
        {groups.flatMap((group) => group.entries).map((entry) => (
          <li key={entry.key}>
            <a
              href={`#${entry.id}`}
              onClick={(event) => {
                event.preventDefault()
                showField(entry.key)
              }}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

A fields container in Vue:

```vue
<script setup lang="ts">
import { fieldsContainerProps } from '@formhaus/vue'

defineProps(fieldsContainerProps)
</script>

<template>
  <div v-bind="rootProps" class="my-stack">
    <slot />
  </div>
</template>
```

### Focus

Focus finds its targets by ids and `data-fh` attributes. A design system that spreads `rootProps` and puts the `id` prop on its controls gets the built-in focus:

- After a failed Continue or Submit with one error, focus goes to the first invalid control inside `[data-fh="fields"]`. With several errors, it goes to `[data-fh="error-summary"]`.
- Without `[data-fh="fields"]`, focus searches the whole form except the `progress`, `actions` and `errorSummary` roots.
- `showField(key)` focuses the field as in [Field focus](#field-focus).
- Focus after Add and Remove depends on the ids and attributes in [Groups: Custom markup](/guide/groups#custom-markup).

The `fh-form__fields`, `fh-field`, `fh-group` and `fh-error-summary` classes work in place of the attributes until 2.0.

### Remove dialog

The dialog opens only when the item has answers. Remove on an empty item, or on one that holds only its defaults, removes it at once. `confirmRemove={false}` in React or `:confirm-remove="false"` in Vue turns the dialog off.

A `layout.confirmDialog` stays mounted with its group, so it can animate. Show it while `open` is `true`. While it is closed, `title` and `confirmLabel` hold the remove label, `cancelLabel` the cancel label, `description` is `''`, and `confirm` and `cancel` do nothing. A `components.confirmDialog` mounts only while a removal waits for an answer, so `open` is always `true` there.

```tsx
import type { ConfirmDialogComponentProps } from '@formhaus/react'

export function RemoveDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <div id={id} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} hidden={!open}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      <button type="button" onClick={cancel}>{cancelLabel}</button>
      <button type="button" onClick={confirm}>{confirmLabel}</button>
    </div>
  )
}
```

A group item in Vue:

```vue
<script setup lang="ts">
import { groupItemComponentProps } from '@formhaus/vue'

const props = defineProps(groupItemComponentProps)
</script>

<template>
  <article role="group" :aria-labelledby="props.titleId" data-fh-group-item>
    <h4 :id="props.titleId" tabindex="-1">{{ props.title }}</h4>
    <component :is="props.fields" />
    <button
      v-if="props.canRemove"
      :id="`${props.titleId}-remove`"
      type="button"
      :aria-label="props.removeName"
      :disabled="props.disabled"
      @click="props.requestRemove"
    >
      {{ props.removeLabel }}
    </button>
  </article>
</template>
```

`DefaultSection`, `DefaultGroup`, `DefaultGroupItem` and `DefaultConfirmDialog` are exported for wrapping.

### Matrix rows

A field in a [`layout: "matrix"` section](/guide/sections#matrix) gets `matrix`: `{ columns, row }`. `columns` are the options of the first row, and `row` is the index of the field among the visible fields of the section. Outside a matrix, `matrix` is `undefined`. In Vue, the field gets `matrix` only when it declares the prop, as `fieldComponentProps` does.

A custom `section` replaces the built-in matrix layout, so it draws the column headers from its `columns` prop, and each row field draws its own cells from `matrix.columns`. The value of a row is the option `value`, as for any `radio` or `multiselect`.

::: code-group
<<< @/recipes/snippets/matrix-row.tsx [React]

<<< @/recipes/snippets/matrix-section.vue [Vue section]

<<< @/recipes/snippets/matrix-row.vue [Vue row]
:::

Map the row as the field type and the section as a slot:

::: code-group
```vue [Vue]
<FormRenderer :definition="definition" :components="{ radio: RadioRow }" :layout="{ section: MatrixSection }" @submit="onSubmit" />
```

```tsx [React]
<FormRenderer definition={definition} components={{ radio: RadioRow }} layout={{ section: MatrixSection }} onSubmit={handleSubmit} />
```
:::

## Fully custom layout

Build the whole form on `useFormEngine` and read the error summary with `errorSummary` from `@formhaus/core`.

::: code-group
<<< @/recipes/snippets/custom-layout.tsx [React]

<<< @/recipes/snippets/custom-layout.vue [Vue]
:::

`errorSummary(engine, { idPrefix?, labels? })` returns `{ groups, topLevelErrors, count }`. It reads the engine errors only: `groups` and `count` are the ones the `errorSummary` slot gets, and `topLevelErrors` is `engine.topLevelErrors`, without the message of a failed `onSubmit`. Each entry `id` is the DOM id the Formhaus renderers give the control of that field, with `idPrefix` as the form id (`fh` without one). For a top-level key made of letters, digits, `_` and `-` that is `<idPrefix>-<key>`, as in the snippet; group items and other keys get derived ids. `labels` overrides the definition `labels` for step and item titles.

## Next steps

- [Field Types](/guide/fields): built-in fields and their settings
- [Custom Actions & Progress](/guide/custom-components): buttons, step progress and runtime props in Vue
- [Validation](/guide/validation): rules and custom validators
