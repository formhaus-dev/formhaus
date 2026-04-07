# Custom Actions & Progress

Replace the built-in form buttons and step progress bar with your own components. Useful when your project has a design system and the default unstyled HTML doesn't fit.

## Custom actions component

Pass your component via the `actionsComponent` (Vue) or `ActionsComponent` (React) prop:

::: code-group
```vue [Vue]
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue'
import MyFormActions from './MyFormActions.vue'
</script>

<template>
  <FormRenderer
    :schema="schema"
    :actions-component="MyFormActions"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
import { FormRenderer } from '@formhaus/react'
import { MyFormActions } from './MyFormActions'

<FormRenderer
  schema={schema}
  ActionsComponent={MyFormActions}
  onSubmit={handleSubmit}
/>
```
:::

Your component receives pre-computed convenience props so you don't need to re-derive button labels or visibility:

| Prop | Type | Description |
|------|------|-------------|
| `primaryLabel` | `string?` | Resolved label for the primary button ("Continue" or submit label) |
| `showBack` | `boolean?` | Whether the back button should be shown |
| `backLabel` | `string?` | Resolved label for the back button |
| `loading` | `boolean?` | Whether the form is submitting |
| `cancelAction` | `FormAction?` | Cancel button config |

In React, call `onPrimary` for the primary action and `onPrev` for back. In Vue, emit `primary` and `prev`.

### Vue example

```vue
<script setup lang="ts">
import type { FormActionsProps } from '@formhaus/vue'

defineProps<FormActionsProps>()
const emit = defineEmits<{
  (e: 'primary'): void
  (e: 'prev'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div class="my-actions">
    <button v-if="showBack" @click="emit('prev')">{{ backLabel }}</button>
    <button @click="emit('primary')" :disabled="loading">{{ primaryLabel }}</button>
  </div>
</template>
```

### React example

```tsx
import type { FormActionsProps } from '@formhaus/react'

export function MyFormActions({
  primaryLabel, showBack, backLabel, loading,
  onPrimary, onPrev,
}: FormActionsProps) {
  return (
    <div className="my-actions">
      {showBack && <button onClick={onPrev}>{backLabel}</button>}
      <button disabled={loading} onClick={onPrimary}>{primaryLabel}</button>
    </div>
  )
}
```

### Raw props

For full control, the raw props are still available:

| Prop | Type | Description |
|------|------|-------------|
| `submitAction` | `FormAction?` | Label and variant for the submit button |
| `backAction` | `FormAction \| false?` | Back button config, or `false` to hide |
| `cancelAction` | `FormAction?` | Cancel button config |
| `isFirstStep` | `boolean` | Whether this is the first step |
| `isLastStep` | `boolean` | Whether this is the last step |
| `isMultiStep` | `boolean` | Whether the form has multiple steps |
| `loading` | `boolean?` | Whether the form is submitting |

In Vue, you can also emit `submit`, `next`, `prev`, `cancel` events directly. In React, call `onSubmit`, `onNext`, `onPrev`, `onCancel` callbacks.

## Custom progress component

Pass your component via the `progressComponent` (Vue) or `ProgressComponent` (React) prop:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :schema="schema"
    :progress-component="MyStepProgress"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
  ProgressComponent={MyStepProgress}
  onSubmit={handleSubmit}
/>
```
:::

Your component receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `current` | `number` | Current step number (1-based) |
| `total` | `number` | Total visible steps |
| `stepTitle` | `string?` | Title of the current step |
| `stepDescription` | `string?` | Description of the current step |

The progress component only renders for multi-step forms.

## Combining both

Use all custom component props together:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :schema="schema"
    :components="{ phone: CustomPhoneInput }"
    :actions-component="MyFormActions"
    :progress-component="MyStepProgress"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
  components={{ phone: CustomPhoneInput }}
  ActionsComponent={MyFormActions}
  ProgressComponent={MyStepProgress}
  onSubmit={handleSubmit}
/>
```
:::

If you don't pass these props, the built-in components render as before. No breaking changes.

## Exported types

Import the prop interfaces to type your custom components:

```ts
// Vue
import type { FormActionsProps, FormStepProgressProps } from '@formhaus/vue'

// React
import type { FormActionsProps, FormStepProgressProps } from '@formhaus/react'
```

## Analytics events

Track form interactions via `onAnalyticsEvent` (React) or `@analyticsEvent` (Vue):

::: code-group
```tsx [React]
<FormRenderer
  schema={schema}
  onAnalyticsEvent={(event) => analytics.track(event.type, event)}
  onSubmit={handleSubmit}
/>
```

```vue [Vue]
<FormRenderer
  :schema="schema"
  @analytics-event="(event) => analytics.track(event.type, event)"
  @submit="onSubmit"
/>
```
:::

Events emitted:

| Event | When | Payload |
|-------|------|---------|
| `field_focused` | User focuses a field | `fieldKey` |
| `field_blurred` | User leaves a field | `fieldKey`, `hasValue` |
| `field_error` | Validation fails | `fieldKey`, `error` |
| `step_completed` | User advances past a step | `stepId` |
| `step_viewed` | A step becomes active | `stepId`, `stepIndex` |
| `form_submitted` | Form submits successfully | `fieldCount` |

All events are optional. If you don't pass a handler, nothing fires.

## Next steps

- [Field Types](/guide/fields): customize field components via the `components` prop
- [Multi-Step Forms](/guide/steps): step navigation, conditional steps, progress
- [Examples](/guide/examples): full form patterns
