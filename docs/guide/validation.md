---
title: "Field validation"
description: "Validate form fields from JSON: required, pattern, min/max length and value, matchField for confirmations, and custom validator functions."
---

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
| `required` | `boolean \| string` | Not null, undefined, an empty string or an empty array. Checkbox and switch fields must be checked | "This field is required" |
| `minLength` | `number` | String length or selected-item count >= value | "Minimum length is N", or "At least N required" for items |
| `maxLength` | `number` | String length or selected-item count <= value | "Maximum length is N", or "At most N allowed" for items |
| `min` | `number` | Number >= value | "Must be at least N" |
| `max` | `number` | Number <= value | "Must be at most N" |
| `pattern` | `string` | Matches regex | "Invalid format" |
| `matchField` | `string` | Value equals another field's value | "Fields must match" |
| `validator` | `string` | Custom validator function returns null | (your message) |

`pattern` is not anchored: `[0-9]{5}` accepts `abc12345x`. Add `^` and `$` to match the whole value.

Length, range, pattern, and matching rules have a corresponding `...Message` field. For `required`, pass the message directly: `required: "Please enter your name"`.

### Pattern safety

`pattern` regexes run synchronously, with no time limit. Some patterns backtrack: on a value that almost matches, `^(a+)+$` takes seconds for 30 characters and doubles with each extra one. `checkDefinition()` warns about these with `slow-pattern`:

- a repeated group with a quantifier or an alternation inside, such as `(a+)+`, `(\w+\s?)+` or `(a|aa)+`
- overlapping repeated parts next to each other, such as `\d*\d*`, `\d+\.?\d*` or `(ab)+(ab)+`
- a pattern longer than 1000 characters, which the check does not scan

A repeated group that starts or ends with a character nothing else in it matches is safe and gets no warning, such as `([a-z]+\.)+` or `(,\s*[a-z]+)*`.

| Slow | Safe |
|------|------|
| `^(\w+\s?)+$` | `^\w+( \w+)*$` |
| `^\d+\.?\d*$` | `^\d+(\.\d*)?$` |
| `^([a-z]+\.?)+$` | `^[a-z]+(\.[a-z]+)*$` |

The engine runs a slow pattern and only warns. [`validateSubmission()`](/guide/server-validation) runs a slow pattern only when it starts with `^`, has no `|` outside a group, and no more than two overlapping repeats in a row can share the same characters, as in `^\d+\.?\d*$` or `^[0-9]+\s?[0-9]+$`. Such a pattern takes about 40 ms on a 10,000-character value, and 0.5 ms on 1,000. Set `maxLength` to keep it short. For any other slow pattern, `validateSubmission()` throws a `FormDefinitionError` with a `slow-pattern` error and runs nothing:

| Pattern | 10,000 characters | `validateSubmission()` |
|---------|-------------------|------------------------|
| `^\d+\.?\d*$` | 40 ms | runs |
| `\d+\.?\d*$` | 2 min | throws |
| `^\d*\d*\d*$` | 2 min | throws |
| `^(a+)+$` | years | throws |

A value longer than 10,000 characters fails `pattern` without being matched.

The check does not find every slow pattern. Separate wildcards such as `^.*x.*y.*z$` take 80 ms on 1,000 characters and 3 s on 4,000, and each extra `.*` makes this worse. If the people who write your definitions are not trusted, run `validateSubmission()` in a worker thread with a timeout.

## matchField

Useful for "confirm email" or "confirm password" fields. The values are compared the next time validation runs. An empty confirmation fails when the other field has a value and passes when both are empty, so keep `required` on it.

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

For synchronous business rules or format checks that cannot be expressed in JSON, register a validator function. Use [async step validation](/guide/async-validation) for server requests.

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
    :definition="definition"
    :validators="{ checkFormat: validateFormat }"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
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

## Rule order

Each field returns its first error. Core runs the rules in this order:

1. `required`. An empty value stops here, so no other rule sees it. `matchField` still fails when the other field has a value.
2. The type check of a built-in type, such as a valid `date` or a number in the range of a `scale`.
3. `minLength` and `maxLength`, or `min` and `max` for a number.
4. `pattern`.
5. `matchField`.
6. The custom `validator`. It runs only on a non-empty value that passed every rule above.

A message set in the definition, such as a string `required` or `patternMessage`, and a validator result are shown as written. The [`messages` catalog](/guide/translations#messages-and-labels) applies only to built-in messages.

`ValidatorFn` is synchronous: it returns a string or `null`, never a Promise. Run server checks in [`onValidate`](/guide/schema-validation), [`onStepValidate`](/guide/async-validation) or the submit handler.

## When validation runs

- **On Continue.** Visible fields on the current step are validated.
- **On Submit.** Visible fields across all visible steps are validated, or all visible fields in a single-step form.
- **Async step validation.** If `onStepValidate` is provided, it runs after sync validation passes but before the step transition. See [Async Step Validation](/guide/async-validation).
- **Schema validation.** If `onValidate` is provided, it runs after the definition rules pass on Continue and on Submit. See [Schema Validation](/guide/schema-validation).
- **Never on blur.** No errors while the user is still typing.
- **Hidden fields are skipped.** If a `show` condition hides a field, it's not validated.
- **Empty non-required fields are skipped.** `minLength`, `pattern`, etc. only run on non-empty values.
- **On the server.** Run [`validateSubmission()`](/guide/server-validation) on the posted values. A request can skip the browser check.

## Next steps

- [Schema Validation](/guide/schema-validation): Zod, Valibot and ArkType through `onValidate`
- [Server-side Validation](/guide/server-validation): validate untrusted submissions
- [Error Handling](/guide/errors): display errors and handle loading states
- [Multi-Step Forms](/guide/steps): validate across multiple steps
- [Definition Reference](/api/definition): full TypeScript types for all validation rules
