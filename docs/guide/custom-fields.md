---
title: "Custom field components"
description: "The contract of a custom Formhaus field in React and Vue: label and error markup, the id, change and commit events, value types and layout slots."
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

## Contract

- The component renders its own label, helper text and error message. The renderer adds no wrapper around it.
- Put the `id` prop on the focusable control. The error summary links to it, and focus after a failed Continue or Submit looks it up. When the element with the `id` is not an `input`, `select`, `textarea`, `button` or an element with `tabindex`, focus goes to the first of those inside it. Focus skips `tabindex="-1"` and `aria-disabled="true"`.
- Give the error message the `id` plus `-error` as its id, and set `aria-invalid` on the control while `error` is set.
- Emit every change: `onChange(value)` in React, `update:modelValue` in Vue.
- Emit `commit` only for a discrete pick, such as a click on an option, and only when `field.autoAdvance` is set. `onCommit(value)` in React, `commit` in Vue. It saves the value and advances the step, so do not also emit a change for that pick.
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

## Value types

A component for a built-in type writes the value that core checks for that type. A value of another shape fails validation.

| Type | Value |
|---|---|
| `text`, `email`, `phone`, `password`, `textarea`, `autocomplete`, `hidden` | string |
| `number` | number, or `null` when cleared |
| `select`, `radio` | string, the option `value` |
| `multiselect` | string[] of distinct option values |
| `checkbox`, `switch` | boolean |
| `date` | string `YYYY-MM-DD` |
| `datetime` | string `YYYY-MM-DDTHH:mm` |
| `time` | string `HH:mm`, 24-hour |
| `scale`, `rating` | number, the selected point |
| `file` | one `File`, or `null` |
| custom type | string, number or boolean |

A `file` field holds one file. Use one `file` field per file.

Write `null` or `''` when the user clears the control. An empty value is checked only against `required` and `matchField`.

## Vue example

A row of buttons for a single choice. It reads the options from the definition:

```json
{
  "key": "plan", "type": "x-choice", "label": "Plan", "autoAdvance": true,
  "validation": { "required": true },
  "options": [{ "value": "basic", "label": "Basic" }, { "value": "pro", "label": "Pro" }]
}
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue'

const props = defineProps(fieldComponentProps)
const emit = defineEmits(fieldComponentEmits)

const id = computed(() => props.id ?? props.field.key)
const describedBy = computed(
  () => [props.field.helperText && `${id.value}-helper`, props.error && `${id.value}-error`].filter(Boolean).join(' ') || undefined,
)

function pick(event: MouseEvent, value: string) {
  if (event.detail > 1) return
  if (props.field.autoAdvance) emit('commit', value)
  else emit('update:modelValue', value)
}
</script>

<template>
  <div class="choice">
    <span :id="`${id}-label`" class="choice__label">{{ props.field.label }}</span>
    <p v-if="props.field.helperText" :id="`${id}-helper`">{{ props.field.helperText }}</p>
    <div
      :id="id"
      role="group"
      :aria-labelledby="`${id}-label`"
      :aria-describedby="describedBy"
      :aria-invalid="props.error ? true : undefined"
      :data-testid="props.testId"
    >
      <button
        v-for="option in props.field.options"
        :key="option.value"
        type="button"
        :aria-pressed="props.modelValue === option.value"
        :disabled="props.disabled || props.loading"
        :data-testid="props.optionTestId?.(option.value)"
        @click="pick($event, option.value)"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="props.error" :id="`${id}-error`" role="alert">{{ props.error }}</p>
  </div>
</template>
```

A click with `event.detail > 1` is the second click of a double-click. Skipping it keeps one answer from also answering the next step. Enter and Space on a button give `detail` 0.

## React example

The same field in React:

```tsx
import type { MouseEvent } from 'react'
import type { FieldComponentProps } from '@formhaus/react'

export function ChoiceButtons({
  id, field, value, error, loading, disabled, testId, optionTestId,
  onChange, onCommit, onBlur, onFocus,
}: FieldComponentProps) {
  const base = id ?? field.key
  const describedBy = [field.helperText && `${base}-helper`, error && `${base}-error`].filter(Boolean).join(' ') || undefined

  const pick = (event: MouseEvent, next: string) => {
    if (event.detail > 1) return
    if (field.autoAdvance && onCommit) onCommit(next)
    else onChange(next)
  }

  return (
    <div className="choice">
      <span id={`${base}-label`} className="choice__label">{field.label}</span>
      {field.helperText && <p id={`${base}-helper`}>{field.helperText}</p>}
      <div
        id={base}
        role="group"
        aria-labelledby={`${base}-label`}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        data-testid={testId}
      >
        {field.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            disabled={disabled || loading}
            data-testid={optionTestId?.(option.value)}
            onClick={(event) => pick(event, option.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p id={`${base}-error`} role="alert">{error}</p>}
    </div>
  )
}
```

`onCommit` is optional: `FormhausField` passes it only when you do.

## Scale

A component for `scale` reads its range and anchor labels from the field:

- The points run from `validation.min` to `validation.max`. They default to 1 and 5. A range has at most 11 points.
- The value is the point as a number, such as `7`. A string such as `"7"` fails validation.
- `options` are optional anchor labels. An option `value` is the point as a string, such as `"0"`. The built-in scale shows the labels of the first point, the middle point `floor((min + max) / 2)` and the last point.

```ts
import type { FormField } from '@formhaus/core'

function scalePoints(field: FormField) {
  const min = field.validation?.min ?? 1
  const max = field.validation?.max ?? 5
  const points = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label
  return { points, start: anchor(min), middle: anchor(Math.floor((min + max) / 2)), end: anchor(max) }
}
```

`rating` always starts at 1. See [Scale](/guide/fields#scale) and [Rating](/guide/fields#rating).

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

`LayoutComponentMap` types the whole map. The `<form class="fh-form">` element stays.

`components.section`, `components.group`, `components.groupItem`, `components.confirmDialog`, `actionsComponent` and `progressComponent` keep working until 2.0. `layout` wins when both are set. In development the renderer warns once per old key with the code `legacy-layout`.

### Slot props

- `fields` gets `rootProps`. The fields come as `children` in React and as the default slot in Vue.
- `section` gets `id`, `section`, `title`, `description` and `descriptionId`. Its fields come as `children` in React and as the default slot in Vue. Each child stays wrapped in the renderer component that keeps its value and errors current, so count fields with `section.fields`, not with the children.
- `group` gets the group texts, `items`, `canAdd`, `add`, `remove(id)`, `requestRemove(id)`, `addLabel`, `removeLabel`, `status`, `disabled` and `itemComponent`. Render each item with `itemComponent`.
- `groupItem` gets `id`, `index`, `title`, `titleId`, `canRemove`, `remove`, `requestRemove`, `hasContent`, `removeLabel`, `removeName` and `disabled`. Its fields come as `children` in React. In Vue, `fields` is a component: render it with `<component :is="fields" />`.
- `confirmDialog` gets `id`, `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `confirm()` and `cancel()`. See [Remove dialog](#remove-dialog).
- `errorSummary` gets `rootProps`, `title`, `groups`, `count` and `showField(key)`. `title` is the `errorSummary` [label](/guide/translations). `groups` has one `{ id, title, entries }` per step with errors, and each entry is `{ key, id, text }` with the DOM id of the field. `showField` opens the step of the field and focuses it. The summary renders when the `errorSummary` prop is not `false` and `count` is above 0.
- `formErrors` gets `rootProps` and `errors`: the `formErrors` of a `{ ok: false }` [submit result](/guide/errors) and the message of a failed action. It renders when `errors` is not empty.
- `progress` and `actions` get the props in [Custom Actions & Progress](/guide/custom-components), plus `rootProps`.

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
- `showField(key)` focuses the element with the id of the field, or the first control inside it.
- When only the error message carries the id (`id` plus `-error`), mark the root of the field with `data-fh="field"`, or of a group with `data-fh="group"`. Focus then goes to the first control inside that root.
- Focus after Add and Remove depends on the ids and attributes in [Groups: Custom markup](/guide/groups#custom-markup).

The `fh-form__fields`, `fh-field`, `fh-group` and `fh-error-summary` classes work in place of the attributes until 2.0.

### Remove dialog

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

A field in a [`layout: "matrix"` section](/guide/sections) gets `matrix`: `{ columns, row }`. `columns` are the options of the first row, and `row` is the index of the field among the visible fields of the section. Draw the cells under the column headers of your `section`. Outside a matrix, `matrix` is `undefined`. In Vue, the field gets `matrix` only when it declares the prop, as `fieldComponentProps` does.

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
