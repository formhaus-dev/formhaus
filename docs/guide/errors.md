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
  }
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :errors="serverErrors"
    @submit="onSubmit"
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

In a multi-step form, if the error is on a field in step 1 and the user is on step 3, the form auto-navigates back to step 1.

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

`FormRenderer` does not track the Promise returned by `onSubmit`. Keep request state in the parent and pass it through `loading`:

::: code-group
```vue [Vue]
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

```tsx [React]
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values) {
    setIsSubmitting(true);
    try {
      await api.submitForm(values);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormRenderer
      definition={definition}
      loading={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
```
:::

When `loading` is true, the default fields and action buttons are disabled. The React primary button also gets `aria-busy`. The built-in actions do not render a spinner; use a custom actions component if you need one.

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
