# Async Step Validation

Run a server check before advancing to the next step. Pass `onStepValidate`, get errors back or `null` to proceed.

## When to use it

- Email/username uniqueness ("already registered")
- Promo code or invite code validation
- Address verification
- Any server-side business rule that blocks the next step

## Setup

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';

async function validateStep(stepId: string, values: Record<string, unknown>) {
  if (stepId === 'account') {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: values.email }),
    });
    const data = await res.json();
    if (data.taken) {
      return { email: 'This email is already registered' };
    }
  }
  return null;
}

function SignupForm() {
  return (
    <FormRenderer
      definition={definition}
      onStepValidate={validateStep}
      onSubmit={handleSubmit}
    />
  );
}
```

```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';

async function validateStep(stepId, values) {
  if (stepId === 'account') {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: values.email }),
    });
    const data = await res.json();
    if (data.taken) {
      return { email: 'This email is already registered' };
    }
  }
  return null;
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :on-step-validate="validateStep"
    @submit="onSubmit"
  />
</template>
```
:::

## Error handling

### Field errors

Return an object with field keys. Errors show on the fields, same as client-side validation.

```ts
return { email: 'Already registered', username: 'Contains banned word' };
```

### Errors for hidden or missing fields

If you return an error for a field that doesn't exist or is currently hidden, it shows as a banner above the buttons (same as [top-level errors](/guide/errors#top-level-errors)).

```ts
return { _rateLimit: 'Too many attempts. Try again in 5 minutes.' };
```

### Network errors

If your function throws, `stepValidating` resets and the error propagates to your code.

```tsx
// React example: catch and show a toast
async function handleNext() {
  try {
    await engine.nextStepAsync();
  } catch (err) {
    toast.error('Connection failed. Check your internet and try again.');
  }
}
```

With `FormRenderer` or `HeadlessFormRenderer`, rejections reach the `onError` callback, or display as a form-level error when it is omitted. You can also return a field or top-level error from `onStepValidate`:

```ts
async function validateStep(stepId, values) {
  try {
    const res = await fetch('/api/validate-step', { ... });
    return await res.json();
  } catch {
    return { _network: 'Could not reach the server. Try again.' };
  }
}
```

## Edge cases

**Back while validating.** Renderers disable Back while an async action is pending. If low-level core navigation changes the step during a pending guard, its result is discarded.

**Last step.** The renderer Submit action does not invoke `onStepValidate`. Perform final server validation in the submit handler before saving.

`nextStepAsync()` returns `false` on the final step without running validation or navigation hooks. Use `onBeforeSubmit` for cancellable checks before submission; see [lifecycle hooks](/guide/steps#lifecycle-hooks).

## Type reference

```ts
type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;
```

The callback receives:
- `stepId` - the `id` of the step being validated (from your definition)
- `values` - all current field values (not just the current step's fields)

Return:
- `{ key: message }` - errors to show. Keys match field keys in your definition.
- `null` or `undefined` - no errors, advance to next step.

## Using the engine directly

If you use `FormEngine` without the React/Vue adapter, call `nextStepAsync()` instead of `nextStep()`:

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, initialValues, {
  validators: { ... },
  onStepValidate: async (stepId, values) => {
    // your server call
  },
});

// In your navigation handler:
const advanced = await engine.nextStepAsync();

// Check loading state for your UI:
engine.stepValidating; // true while navigation validation and hooks are running
```

`nextStep()` ignores `onStepValidate` and lifecycle hooks. `nextStepAsync()` also awaits the [before/after navigation hooks](/guide/steps#lifecycle-hooks); a before-hook can cancel an otherwise valid transition.

## Next steps

- [Validation](/guide/validation): client-side validation rules (runs before async)
- [Error Handling](/guide/errors): how errors display, loading states
- [Multi-Step Forms](/guide/steps): step navigation, conditional steps, progress
- [Definition Reference](/api/definition): all TypeScript types
