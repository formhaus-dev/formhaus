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

Your component receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `submitAction` | `FormAction?` | Label and variant for the submit button |
| `backAction` | `FormAction \| false?` | Back button config, or `false` to hide |
| `cancelAction` | `FormAction?` | Cancel button config |
| `isFirstStep` | `boolean` | Whether this is the first step |
| `isLastStep` | `boolean` | Whether this is the last step |
| `isMultiStep` | `boolean` | Whether the form has multiple steps |
| `loading` | `boolean?` | Whether the form is submitting |

In Vue, emit `submit`, `next`, `prev`, `cancel` events. In React, call `onSubmit`, `onNext`, `onPrev`, `onCancel` callbacks.

### Vue example

```vue
<script setup lang="ts">
import type { FormActionsProps } from '@formhaus/vue'

defineProps<FormActionsProps>()
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div class="my-actions">
    <button v-if="isMultiStep && !isFirstStep" @click="emit('prev')">
      Back
    </button>
    <button @click="isLastStep || !isMultiStep ? emit('submit') : emit('next')" :disabled="loading">
      {{ isLastStep || !isMultiStep ? (submitAction?.label ?? 'Submit') : 'Continue' }}
    </button>
  </div>
</template>
```

### React example

```tsx
import type { FormActionsProps } from '@formhaus/react'

export function MyFormActions({
  submitAction, isFirstStep, isLastStep, isMultiStep, loading,
  onSubmit, onNext, onPrev,
}: FormActionsProps) {
  return (
    <div className="my-actions">
      {isMultiStep && !isFirstStep && (
        <button onClick={onPrev}>Back</button>
      )}
      <button
        disabled={loading}
        onClick={isLastStep || !isMultiStep ? onSubmit : onNext}
      >
        {isLastStep || !isMultiStep ? (submitAction?.label ?? 'Submit') : 'Continue'}
      </button>
    </div>
  )
}
```

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

## Next steps

- [Field Types](/guide/fields): customize field components via the `components` prop
- [Multi-Step Forms](/guide/steps): step navigation, conditional steps, progress
- [Examples](/guide/examples): full form patterns
