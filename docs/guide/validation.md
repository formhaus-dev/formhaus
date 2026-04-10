# Validation

Validation runs on Submit or Continue click. No validation on blur.

## Built-in rules

All rules are optional. Combine them freely.

```json
{
  "key": "password",
  "type": "password",
  "label": "Password",
  "validation": {
    "required": true,
    "minLength": 8,
    "minLengthMessage": "Password must be at least 8 characters",
    "pattern": "(?=.*[A-Z])(?=.*[0-9])",
    "patternMessage": "Must include a number and uppercase letter"
  }
}
```

| Rule | Type | What it checks | Default message |
|------|------|---------------|-----------------|
| `required` | `boolean \| string` | Not empty (null, undefined, or "") | "This field is required" |
| `minLength` | `number` | String length >= value | "Must be at least N characters" |
| `maxLength` | `number` | String length <= value | "Must be at most N characters" |
| `min` | `number` | Number >= value | "Must be at least N" |
| `max` | `number` | Number <= value | "Must be at most N" |
| `pattern` | `string` | Matches regex | "Invalid format" |
| `matchField` | `string` | Value equals another field's value | "Fields must match" |
| `validator` | `string` | Custom validator function returns null | (your message) |

Every rule has a `...Message` field for custom error text. Pass `required: "Please enter your name"` and that string becomes the error message.

## matchField

Useful for "confirm email" or "confirm password" fields. When either field changes, the match is re-evaluated.

```json
[
  {
    "key": "email",
    "type": "email",
    "label": "Email",
    "validation": { "required": true }
  },
  {
    "key": "confirmEmail",
    "type": "email",
    "label": "Confirm email",
    "validation": {
      "required": true,
      "matchField": "email",
      "matchFieldMessage": "Email addresses must match"
    }
  }
]
```

## Custom validators

For validation that can't be expressed in JSON (API checks, business rules), register a validator function:

::: code-group
```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';

function validateFormat(value, allValues) {
  if (!value) return null;
  return isValidFormat(value) ? null : 'Invalid format';
}
</script>

<template>
  <FormRenderer
    :schema="schema"
    :validators="{ checkFormat: validateFormat }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  schema={schema}
  validators={{ checkFormat: validateFormat }}
  onSubmit={handleSubmit}
/>

function validateFormat(value: unknown, allValues: Record<string, unknown>) {
  if (!value) return null;
  return isValidFormat(value as string) ? null : 'Invalid format';
}
```
:::

Reference the validator by name in the definition:

```json
{
  "key": "code",
  "type": "text",
  "label": "Code",
  "validation": { "validator": "checkFormat" }
}
```

## When validation runs

- **On Submit/Continue click.** All visible fields on the current step are validated.
- **Async step validation.** If `onStepValidate` is provided, it runs after sync validation passes but before the step transition. See [Async Step Validation](/guide/async-validation).
- **Never on blur.** No errors while the user is still typing.
- **Hidden fields are skipped.** If a `show` condition hides a field, it's not validated.
- **Empty non-required fields are skipped.** `minLength`, `pattern`, etc. only run on non-empty values.

## Next steps

- [Error Handling](/guide/errors): display errors and handle loading states
- [Multi-Step Forms](/guide/steps): validate across multiple steps
- [Definition Reference](/api/definition): full TypeScript types for all validation rules
