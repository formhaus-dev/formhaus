---
title: "Error handling"
description: "Show server-side errors in a Formhaus form: field-level and top-level errors, navigation to the failing step, and form and field loading states."
---

# Error Handling

The server might reject submitted data. Return its errors from the submit handler and the form shows them.

## Submit results

Return `{ ok: false, errors }` to reject a submission with field errors, `formErrors` for messages that belong to no field, or nothing for a success. `SubmitResult` is exported by `@formhaus/core`.

::: code-group
```vue [Vue]
<script setup lang="ts">
import type { SubmitResult } from '@formhaus/core';

async function onSubmit(values: Record<string, unknown>): Promise<SubmitResult> {
  const response = await fetch('/api/accounts', { method: 'POST', body: JSON.stringify(values) });
  if (response.status === 422) return { ok: false, errors: (await response.json()).errors };
  if (!response.ok) return { ok: false, formErrors: ['We could not save your answers. Try again.'] };
  return { ok: true };
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="onSubmit" :on-after-submit="showReceipt" />
</template>
```

```tsx [React]
import type { SubmitResult } from '@formhaus/core';

async function onSubmit(values: Record<string, unknown>): Promise<SubmitResult> {
  const response = await fetch('/api/accounts', { method: 'POST', body: JSON.stringify(values) });
  if (response.status === 422) return { ok: false, errors: (await response.json()).errors };
  if (!response.ok) return { ok: false, formErrors: ['We could not save your answers. Try again.'] };
  return { ok: true };
}

<FormRenderer definition={definition} onSubmit={onSubmit} onAfterSubmit={showReceipt} />
```
:::

After a rejection:

- Every answer stays in the form.
- All errors apply at once. In a multi-step form the form opens the earliest step with an error, whatever order the keys come in, and moves focus as after a failed Submit.
- `onAfterSubmit` does not run. It runs exactly once after a success.
- An error for a key the form does not have, or for a hidden field, shows above the buttons.

Editing a field removes only that field's server error. Errors on other steps stay while the user moves back and forward and while other fields are validated. The next response replaces the whole set. The [specification](/spec#server-errors) lists every clearing rule.

If your API uses other key names, map them in the handler. See [Multi-step form on a flat API](/recipes/flat-api).

## Network failures and exceptions

Let a failed request throw. The form keeps the answers and the previous server errors, and `onAfterSubmit` does not run. The rejection reaches `onError`, or the form-level error banner when that callback is omitted. With `onError`, the banner does not show the rejection; display it yourself.

## The errors prop

`errors` takes the same `{ fieldKey: message }` object and applies it like a rejection. It predates submit results and still works. Use one of the two for the same request, not both.

::: code-group
```vue [Vue]
<FormRenderer :definition="definition" :errors="serverErrors" @submit="onSubmit" />
```

```tsx [React]
<FormRenderer definition={definition} errors={errors} onSubmit={handleSubmit} />
```
:::

A handler that sets `errors` and returns normally counts as a success, so `onAfterSubmit` runs. The errors it set stay. Rethrow the failure, or return `{ ok: false }`, to stop the after-hook.

## Top-level errors

Errors without a visible field show as a banner between the fields and the Submit/Continue buttons. The banner has `role="alert"`.

Covers cases like:
- Account suspended
- Rate limit exceeded
- Generic server errors

```ts
return { ok: false, formErrors: ['Your account has been temporarily suspended.'] };
```

## Error summary and step marks

The error summary lists every field error in step order. By default it sits below the fields, above the step buttons. Each entry is a link that opens the step of the field and focuses it. When errors span more than one step, the list groups them under each step's title. A label that ends with `?`, `!`, `:` or `.` is followed by a space instead of `: `. It is on by default; pass `errorSummary={false}` in React or `:error-summary="false"` in Vue to turn it off. Pass `errorSummary="top"` to put it first in the form, before the progress and the fields, as GOV.UK and USWDS ask. `"bottom"` and `true` keep it above the buttons. Focus works the same in both places. After a failed Continue or Submit with two or more errors, focus moves to the summary. With one error, or with the summary off, focus moves to the first invalid field. `stepErrorMarks` lists the steps under the progress bar and marks the ones with errors. It is off by default.

The progress header always shows the title of the current step in the error color while that step has errors, with the `stepErrors` label as text for screen readers.

::: code-group
```vue [Vue]
<FormRenderer :definition="definition" step-error-marks @submit="onSubmit" />
```

```tsx [React]
<FormRenderer definition={definition} stepErrorMarks onSubmit={onSubmit} />
```
:::

A custom progress component receives the error count of the current step as `stepErrorCount`, and the step list as `steps` when `stepErrorMarks` is on. Headless code reads `engine.stepErrors`.

## Errors in app code

The renderer handle reads the errors and opens a field from outside the form.

::: code-group
```vue [Vue]
<script setup lang="ts">
import { FormRenderer, type FormRendererHandle } from '@formhaus/vue';
import { ref } from 'vue';

const form = ref<FormRendererHandle>();

function showFirstError() {
  const first = form.value?.getErrors().groups[0]?.entries[0];
  if (first) form.value?.showField(first.key);
}
</script>

<template>
  <FormRenderer ref="form" :definition="definition" @submit="onSubmit" />
  <button type="button" @click="showFirstError">Show the first error</button>
</template>
```

```tsx [React]
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { useRef } from 'react';

export function Checkout() {
  const form = useRef<FormRendererHandle>(null);
  const showFirstError = () => {
    const first = form.current?.getErrors().groups[0]?.entries[0];
    if (first) form.current?.showField(first.key);
  };
  return (
    <>
      <FormRenderer ref={form} definition={definition} onSubmit={handleSubmit} />
      <button type="button" onClick={showFirstError}>
        Show the first error
      </button>
    </>
  );
}
```
:::

`getErrors()` returns `{ groups, topLevelErrors, count }`, the errors on screen: the summary groups, and the top-level errors plus the message of a failed `onSubmit`. `showField(key)` opens the step of the field and focuses it, as a summary link does. `showField` does nothing while a step check or a submit is pending, and for keys of hidden or unknown fields. For a form without `FormRenderer`, see [Fully custom layout](/guide/custom-fields#fully-custom-layout).

## Async step validation errors

See [Async Step Validation](/guide/async-validation#error-handling) for how `onStepValidate` errors display and how to handle network failures.

## Loading state

React awaits the Promise returned by `onSubmit`, and Vue the one returned by the `@submit` listener. `FormRenderer` and `HeadlessFormRenderer` keep fields and actions busy during awaited navigation, submission and lifecycle hooks.

::: code-group
```vue [Vue]
<FormRenderer
  :definition="definition"
  @submit="save"
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

Here `save(values)` returns the request Promise and rejects on failure. No separate loading state is required for that request.

Keep parent-owned `loading` for other work that should disable the form:

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

While busy, the default fields and action buttons are disabled. The form has `aria-busy`; the React primary button also has it. The built-in actions do not render a spinner; use a custom actions component if you need one. See [lifecycle ordering and after-hook failures](/guide/steps#lifecycle-hooks).

### Loading button

A custom actions component receives `loading` and the resolved `primaryLabel`:

```tsx
import { FormRenderer, type FormActionsProps } from '@formhaus/react';

function SavingActions({ primaryLabel, showPrimary = true, showBack, backLabel, loading, onPrimary, onBack }: FormActionsProps) {
  return (
    <div className="actions">
      {showBack && <button type="button" disabled={loading} onClick={onBack}>{backLabel}</button>}
      {showPrimary && (
        <button type="button" disabled={loading} aria-busy={loading} onClick={onPrimary}>
          {loading ? 'Saving…' : primaryLabel}
        </button>
      )}
    </div>
  );
}

<FormRenderer definition={definition} onSubmit={save} layout={{ actions: SavingActions }} />
```

`loading` is `true` while `onSubmit`, `onStepValidate` or a lifecycle hook runs. All props, and the Vue version, are in [Custom Actions & Progress](/guide/custom-components).

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
