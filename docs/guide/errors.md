---
description: "Show server-side errors in a Formhaus form: field-level and top-level errors, navigation to the failing step, and form and field loading states."
---

# Error Handling

The server might reject submitted data. Pass errors back to the form and it handles display.

## Field-level errors

Pass a `{ fieldKey: message }` object. The error shows on the field, and the form navigates to the step containing it.

::: code-group
```vue [Vue]
<script setup>
import { ref } from 'vue';

const serverErrors = ref({});

async function onSubmit(values) {
  try {
    await api.submitForm(values);
  } catch (err) {
    // Server returns: { email: "Already registered" }
    serverErrors.value = err.fieldErrors;
    throw err;
  }
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :errors="serverErrors"
    :submit-handler="onSubmit"
  />
</template>
```

```tsx [React]
function MyForm() {
  const [errors, setErrors] = useState({});

  async function handleSubmit(values) {
    try {
      await api.submitForm(values);
    } catch (err) {
      // Server returns: { email: "Already registered" }
      setErrors(err.fieldErrors);
      throw err;
    }
  }

  return (
    <FormRenderer
      definition={definition}
      errors={errors}
      onSubmit={handleSubmit}
    />
  );
}
```
:::

In a multi-step form, if the error is on a field in step 1 and the user is on step 3, the form auto-navigates back to step 1. If you catch a failed save to map its field errors, rethrow it so `onAfterSubmit` does not run as if saving succeeded. Rejections reach `onError`, or the form-level error banner when that callback is omitted.

## Top-level errors

If the error targets a field that doesn't exist (or is hidden), it shows as a banner above the action buttons.

Covers cases like:
- Account suspended
- Rate limit exceeded
- Generic server errors

```ts
// Server returns an error for a non-existent field key
setErrors({ _general: 'Your account has been temporarily suspended.' });
```

The banner renders between the fields and the Submit/Continue buttons.

## Async step validation errors

See [Async Step Validation](/guide/async-validation#error-handling) for how `onStepValidate` errors display and how to handle network failures.

## Loading state

React awaits the Promise returned by `onSubmit`. Vue awaits `submitHandler`; the legacy `@submit` event is a notification and cannot await an async listener. `FormRenderer` and `HeadlessFormRenderer` keep fields and actions busy during awaited navigation, submission and lifecycle hooks.

::: code-group
```vue [Vue]
<FormRenderer
  :definition="definition"
  :submit-handler="save"
  :on-error="handleRequestError"
/>
```

```tsx [React]
<FormRenderer
  definition={definition}
  onSubmit={save}
  onError={handleRequestError}
/>
```
:::

Here `save(values)` returns the request Promise and rejects on failure. No separate loading state is required for that request. In Vue, `@submit` still fires after `submitHandler` succeeds; do not send the same request from both.

Keep parent-owned `loading` for other work that should disable the form, or for a legacy Vue `@submit` listener that performs the save itself:

```vue
<script setup>
import { ref } from 'vue';

const isSubmitting = ref(false);

async function onSubmit(values) {
  isSubmitting.value = true;
  try {
    await api.submitForm(values);
  } catch (error) {
    handleRequestError(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :loading="isSubmitting"
    @submit="onSubmit"
  />
</template>
```

With this legacy Vue pattern, `onAfterSubmit` means the event was dispatched, not that its async listener finished. Use `submitHandler` when the lifecycle must include the request.

While busy, the default fields and action buttons are disabled. The form has `aria-busy`; the React primary button also has it. The built-in actions do not render a spinner; use a custom actions component if you need one. See [lifecycle ordering and after-hook failures](/guide/steps#lifecycle-hooks).

## Field-level loading

Custom renderers built around `FormEngine` or `useFormEngine` can mark one field as loading:

```ts
engine.setFieldLoading('city', true);
try {
  const result = await lookupCity(engine.values.zipCode);
  engine.setValue('city', result.name);
} finally {
  engine.setFieldLoading('city', false);
}
```

`FormRenderer` owns its engine. Calling `useFormEngine()` next to a `FormRenderer` creates a separate instance and does not change the rendered form. Use the hook when you are building the renderer yourself. See [Values and validation](/api/form-engine#values-and-validation) for the underlying methods.

## Next steps

- [Validation](/guide/validation): client-side validation rules
- [Examples](/guide/examples): error handling in real definitions
- [Definition Reference](/api/definition): full TypeScript types
