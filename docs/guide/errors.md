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

Show a loading indicator on the submit button while the request is pending:

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    :loading="isSubmitting"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  loading={isSubmitting}
  onSubmit={handleSubmit}
/>
```
:::

When `loading` is true, the submit button shows a spinner and is disabled.

## Field-level loading

Some fields load data asynchronously (e.g. looking up a city by zip code). Use `setFieldLoading` on the engine:

::: code-group
```vue [Vue]
<script setup>
import { useFormEngine } from '@formhaus/vue';

const { engine } = useFormEngine(definition);

async function onFieldChange(key, value) {
  if (key === 'zipCode' && value.length === 5) {
    engine.setFieldLoading('city', true);
    const result = await lookupCity(value);
    engine.setValue('city', result.name);
    engine.setFieldLoading('city', false);
  }
}
</script>
```

```tsx [React]
const engine = useFormEngine(definition);

function onFieldChange(key, value) {
  if (key === 'zipCode' && value.length === 5) {
    engine.setFieldLoading('city', true);
    lookupCity(value).then(result => {
      engine.setValue('city', result.name);
      engine.setFieldLoading('city', false);
    });
  }
}
```
:::

## Next steps

- [Validation](/guide/validation): client-side validation rules
- [Examples](/guide/examples): error handling in real definitions
- [Definition Reference](/api/definition): full TypeScript types
