---
title: "Custom actions and progress bar"
description: "Replace Formhaus buttons and the step progress bar with design system components in React or Vue, or render everything with the headless renderer."
---

# Custom Actions & Progress

Replace the built-in form buttons and step progress bar with your own components. Useful when your project has a design system and the default unstyled HTML doesn't fit. Both are keys of the `layout` prop. For fields and the other [layout slots](/guide/custom-fields#layout-slots), see [Custom Fields](/guide/custom-fields).

## Custom actions component

Pass your component as `layout.actions`:

::: code-group
```vue [Vue]
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue'
import MyFormActions from './MyFormActions.vue'
</script>

<template>
  <FormRenderer
    :definition="definition"
    :layout="{ actions: MyFormActions }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
import { FormRenderer } from '@formhaus/react'
import { MyFormActions } from './MyFormActions'

<FormRenderer
  definition={definition}
  layout={{ actions: MyFormActions }}
  onSubmit={handleSubmit}
/>
```
:::

The `actionsComponent` prop still works until 2.0 and warns once in development. Its component gets the props below without `rootProps`. `FormhausForm` takes its own `actionsComponent` without the warning.

Your component receives pre-computed convenience props so you don't need to re-derive button labels or visibility:

| Prop | Type | Description |
|------|------|-------------|
| `primaryLabel` | `string?` | Resolved label for the primary button: the `continue` [label](/guide/translations), the submit label or the `submit` label |
| `showPrimary` | `boolean?` | False when the current step hides Next with `next: false`; final Submit remains visible |
| `primaryDisabled` | `boolean?` | True while the `disabled` conditions of the primary action match. Only a `layout.actions` gets it. Disable the button while `primaryDisabled` or `loading` is set |
| `showBack` | `boolean?` | Whether the back button should be shown |
| `backLabel` | `string?` | Resolved label for the back button |
| `showSkip` | `boolean?` | Whether the skip button should be shown |
| `skipLabel` | `string?` | Label for the skip button, defaults to the `skip` label or "Skip" |
| `loading` | `boolean?` | Parent loading state or pending navigation/submission, including hooks |
| `cancelAction` | `FormAction?` | Cancel button config |
| `testIds` | `{ submit?, next?, back? }` | [Test ids](/guide/testing) of the buttons, when the renderer has `testIds` |
| `rootProps` | `{ 'data-fh': 'actions' }` | Spread on the root element, so focus after an error never lands on a button. See [Root props](/guide/custom-fields#root-props) |

In React, call `onPrimary` for the primary action, `onBack` for back and `onSkip` for skip. In Vue, emit `primary`, `back` and `skip`.

### Vue example

```vue
<script setup lang="ts">
import { formActionsEmits, formActionsProps } from '@formhaus/vue'

defineProps(formActionsProps)
const emit = defineEmits(formActionsEmits)
</script>

<template>
  <div v-bind="rootProps" class="my-actions">
    <button v-if="showBack" type="button" :disabled="loading" @click="emit('back')">{{ backLabel }}</button>
    <button v-if="showPrimary !== false" type="button" @click="emit('primary')" :disabled="loading">{{ primaryLabel }}</button>
  </div>
</template>
```

### React example

```tsx
import type { FormActionsProps } from '@formhaus/react'

export function MyFormActions({
  primaryLabel, showPrimary = true, showBack, backLabel, loading,
  onPrimary, onBack, rootProps,
}: FormActionsProps) {
  return (
    <div {...rootProps} className="my-actions">
      {showBack && <button type="button" disabled={loading} onClick={onBack}>{backLabel}</button>}
      {showPrimary && <button type="button" disabled={loading} onClick={onPrimary}>{primaryLabel}</button>}
    </div>
  )
}
```

### Raw props

| Prop | Type | Description |
|------|------|-------------|
| `submitAction` | `FormAction?` | Label and variant for the submit button |
| `nextAction` | `FormAction \| false?` | Next button config of the current step |
| `backAction` | `FormAction \| false?` | Back button config, or `false` to hide |
| `cancelAction` | `FormAction?` | Cancel button config |
| `skipAction` | `FormAction?` | Skip button config of the current step |
| `isFirstStep` | `boolean` | Whether this is the first step |
| `isLastStep` | `boolean` | Whether this is the last step |
| `isMultiStep` | `boolean` | Whether the form has multiple steps |
| `loading` | `boolean?` | Parent loading state or pending navigation/submission, including hooks |

In Vue, you can also emit `submit`, `next`, `back`, `cancel` events directly. In React, call `onSubmit`, `onNext`, `onBack`, `onCancel` callbacks.

## Custom progress component

Pass your component as `layout.progress`:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :layout="{ progress: MyStepProgress }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  layout={{ progress: MyStepProgress }}
  onSubmit={handleSubmit}
/>
```
:::

The `progressComponent` prop still works until 2.0 and warns once in development. Its component gets no `rootProps` and no `marks`, and gets `steps` only when the renderer has `stepErrorMarks`.

Your component receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `current` | `number` | Current step number (1-based) |
| `total` | `number` | Total visible steps |
| `stepTitle` | `string?` | Title of the current step |
| `stepDescription` | `string?` | Description of the current step |
| `headingLevel` | `1` to `6`, optional | Heading level for the step title, from the renderer's `headingLevel` prop. The built-in progress renders `<h2>` by default |
| `steps` | `FormStepStatus[]?` | Steps of the active path as `{ id, title, errorCount, errorsLabel }`. `errorsLabel` is the `stepErrors` label when the step has errors. A `layout.progress` always gets them, a `progressComponent` only with `stepErrorMarks` |
| `marks` | `boolean?` | `true` when the renderer has `stepErrorMarks`, else `false`. Only a `layout.progress` gets it |
| `counterLabel` | `string?` | Step counter text from the `stepOf` [label](/guide/translations), such as `Step 2 of 3` |
| `stepErrorCount` | `number?` | Number of field errors on the current step |
| `stepErrorsLabel` | `string?` | The `stepErrors` [label](/guide/translations) for the current step, such as `Errors: 2`, when it has errors. Only a `layout.progress` gets it |
| `rootProps` | `{ 'data-fh': 'progress' }` | Spread on the root element, so focus after an error never lands on a step button |

The progress component only renders for multi-step forms. The built-in `FormStepProgress` draws the step list only when `marks` is `true`. Rendered on its own, it draws `steps` unless `marks` is `false`.

## Combining both

Field types go to `components`, everything around them to `layout`:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :components="{ phone: CustomPhoneInput }"
    :layout="{ actions: MyFormActions, progress: MyStepProgress }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  components={{ phone: CustomPhoneInput }}
  layout={{ actions: MyFormActions, progress: MyStepProgress }}
  onSubmit={handleSubmit}
/>
```
:::

A key you leave out keeps the built-in component.

## Headless renderer

`FormRenderer` imports the built-in native fields, actions and step progress. They stay in your bundle even when you replace all of them. See [Choose a renderer](/guide/#choose-a-renderer) for the three paths and [Bundle size](/guide/bundle-size#rendering-paths) for their sizes. If you map every field type you use and pass your own actions and progress components, use `HeadlessFormRenderer`. It takes the same props and events as `FormRenderer`, but it does not import any built-in component. This drops the built-in fields from your bundle.

::: code-group
```vue [Vue]
<script setup lang="ts">
import { HeadlessFormRenderer } from '@formhaus/vue'
</script>

<template>
  <HeadlessFormRenderer
    :definition="definition"
    :components="{ text: MyInput, email: MyInput, select: MySelect }"
    :layout="{ actions: MyFormActions, progress: MyStepProgress }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
import { HeadlessFormRenderer } from '@formhaus/react'

<HeadlessFormRenderer
  definition={definition}
  components={{ text: MyInput, email: MyInput, select: MySelect }}
  layout={{ actions: MyFormActions, progress: MyStepProgress }}
  onSubmit={handleSubmit}
/>
```
:::

`HeadlessFormRenderer` supports the same [lifecycle hooks and awaited submission](/guide/steps#lifecycle-hooks). Custom fields must implement [explicit activation](/guide/fields#explicit-field-activation) for `autoAdvance`; custom actions must honor `showPrimary` and `loading` as above.

`HeadlessFormRenderer` has no fallbacks:

- A field type with no mapped component renders an "Unsupported field type" placeholder. In development the renderer also warns with `missing-component`.
- Without `layout.actions`, the form renders no buttons.
- Without `layout.progress`, a multi-step form renders no progress bar.
- The other layout slots keep the built-in markup when left out.

## Render one field

`FormhausField` renders a single field with the built-in components as fallbacks. Pass `components` to override some types. Both packages also export every built-in field (`TextField`, `TextareaField`, `SelectField`, `AutocompleteField`, `MultiselectField`, `CheckboxField`, `RadioField`, `SwitchField`, `FileField`, `DateField`, `DateTimeField`, `TimeField`, `ScaleField`, `HiddenField`) and `defaultFieldComponents`.

::: code-group
```vue [Vue]
<FormhausField :field="field" v-model="value" />
```

```tsx [React]
<FormhausField field={field} value={value} onChange={setValue} onBlur={() => {}} />
```
:::

## Exported types

Import the prop interfaces to type your custom components:

```ts
// Vue
import type { FormActionsProps, FormStepProgressProps, LayoutComponentMap, RootProps } from '@formhaus/vue'

// React
import type { FormActionsProps, FormStepProgressProps, LayoutComponentMap, RootProps } from '@formhaus/react'
```

## Runtime props in Vue

The Vue SFC compiler turns `defineProps<T>()` into runtime prop declarations, and for that it must resolve `T`. It often cannot resolve a type imported from a package, and fails or declares a prop with the wrong runtime type. `@formhaus/vue` exports runtime declarations for every custom component. Pass them to `defineProps` and `defineEmits`; the props stay fully typed.

```vue
<script setup lang="ts">
import { groupItemComponentProps } from '@formhaus/vue'

const props = defineProps(groupItemComponentProps)
</script>
```

| Component | Props | Emits |
|---|---|---|
| Field | `fieldComponentProps` | `fieldComponentEmits` |
| Actions | `formActionsProps` | `formActionsEmits` |
| Step progress | `formStepProgressProps` | |
| Fields container | `fieldsContainerProps` | |
| Section | `sectionComponentProps` | |
| Group | `groupComponentProps` | |
| Group item | `groupItemComponentProps` | |
| Remove dialog | `confirmDialogComponentProps` | |
| Error summary | `errorSummaryComponentProps` | |
| Form errors | `formErrorsComponentProps` | |

Each declares every prop of the matching interface, such as `FieldComponentProps` for `fieldComponentProps`. Props you do not use are harmless. `formStepProgressProps` defaults `headingLevel` to `2` and `marks` to `true`.

## Form events

Track the form lifecycle via `onFormEvent` (React) or `@formEvent` (Vue). Event `type` names are `snake_case`, the usual convention for analytics tools:

::: code-group
```tsx [React]
<FormRenderer
  definition={definition}
  onFormEvent={(event) => analytics.track(event.type, event)}
  onSubmit={handleSubmit}
/>
```

```vue [Vue]
<FormRenderer
  :definition="definition"
  @form-event="(event) => analytics.track(event.type, event)"
  @submit="onSubmit"
/>
```
:::

Events emitted:

| Event | When | Payload |
|-------|------|---------|
| `form_viewed` | The form is shown. Once per engine: a remount or a new definition reports it again | |
| `step_viewed` | A step becomes active: on first show and after every step change | `stepId`, `stepIndex` |
| `step_completed` | User advances past a step. The last step reports `form_submitted` instead | `stepId` |
| `step_skipped` | User skips a step | `stepId` |
| `step_redirected` | `goToStep()` cannot open the requested step and opens another one | `requestedStepId`, `stepId`, `reason`: `'unknown-step'`, `'not-on-path'` or `'blocked'` |
| `field_focused` | User focuses a field | `fieldKey` |
| `field_blurred` | User leaves a field | `fieldKey`, `hasValue` |
| `field_shown` | A field's `show` condition, or its section's, starts to pass. Reports fields on every step, not only the current one, and can fire on `reset()` | `fieldKey` |
| `field_hidden` | A field's `show` condition, or its section's, stops passing. Reports fields on every step, not only the current one, and can fire on `reset()` | `fieldKey` |
| `field_error` | Step validation, form validation or the submit handler fails with field errors | `fieldKey`, `error` |
| `form_submitted` | Validation and `onBeforeSubmit` pass, right before the submit handler runs | `fieldCount` |
| `form_submit_succeeded` | The submit handler resolves without `{ ok: false }` | |
| `form_submit_failed` | Submit fails validation, or the submit handler returns `{ ok: false }` or throws | `reason`: `'validation'`, `'rejected'` or `'error'`. `status` for `'error'` when the thrown error has a numeric `status`, such as `CloudError` |
| `form_reset` | `engine.reset()` runs after the form is shown | |

The order of events is in the [specification](/spec#form-events). Events carry step ids and field keys, never step titles or labels with [recalled answers](/guide/fields#answer-recall). Group item fields report their path as `fieldKey`, such as `people.0.name`. `field_shown` and `field_hidden` do not fire for step changes, for added or removed group items, or for fields without a condition. A reset during a pending submit is still followed by that submit's `form_submit_succeeded` or `form_submit_failed`. An error thrown by the handler does not stop the form. It is rethrown in a microtask. All events are optional. If you don't pass a handler, nothing fires. The event type is `FormEvent`.

`FormEngine` reports the same events, except `field_focused` and `field_blurred`, through the `onFormEvent` option. See [form events](/api/form-engine#form-events).

## Next steps

- [Custom Fields](/guide/custom-fields): the field component contract and layout slots
- [Field Types](/guide/fields): customize field components via the `components` prop
- [Multi-Step Forms](/guide/steps): step navigation, conditional steps, progress
- [Examples](/guide/examples): full form patterns
