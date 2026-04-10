# Multi-Step Forms

Split a form into steps. The renderer handles navigation, progress, and per-step validation.

## Basic multi-step

Use `steps` instead of `fields` in the definition:

```json
{
  "id": "account-setup",
  "title": "Account Setup",
  "submit": { "label": "Create Account" },
  "steps": [
    {
      "id": "personal",
      "title": "Personal Information",
      "description": "Tell us about yourself",
      "fields": [
        { "key": "name", "type": "text", "label": "Full name", "validation": { "required": true } },
        { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } }
      ]
    },
    {
      "id": "address",
      "title": "Address",
      "fields": [
        { "key": "street", "type": "text", "label": "Street", "validation": { "required": true } },
        { "key": "city", "type": "text", "label": "City", "validation": { "required": true } }
      ]
    },
    {
      "id": "confirm",
      "title": "Confirm",
      "fields": [
        { "key": "terms", "type": "checkbox", "label": "I accept the terms", "validation": { "required": "You must accept" } }
      ]
    }
  ]
}
```

## Navigation behavior

- **Continue** validates the current step. If valid, moves to the next visible step. If not, shows errors.
- **Back** goes to the previous visible step. No validation.
- **Submit** replaces Continue on the last visible step.
- **Progress bar** shows "Step N of M" based on visible steps.

## Custom CTA per step

Override the Continue or Back button text/style on any step:

```json
{
  "id": "review",
  "title": "Review & Send",
  "back": { "label": "Edit Details", "variant": "text" },
  "fields": [...]
}
```

Set `back` to `false` to hide the Back button on a step:

```json
{
  "id": "first-step",
  "title": "Welcome",
  "back": false,
  "fields": [...]
}
```

## Conditional steps

Steps support `show`/`showAny` conditions, same as fields. Hidden steps are skipped, and their fields are not validated or submitted.

```json
{
  "id": "business-info",
  "title": "Business Details",
  "show": [{ "field": "accountType", "eq": "business" }],
  "fields": [
    { "key": "companyName", "type": "text", "label": "Company name" },
    { "key": "taxId", "type": "text", "label": "Tax ID" }
  ]
}
```

When the user picks "personal" instead of "business", this step vanishes. The progress bar updates from "Step 2 of 4" to "Step 2 of 3".

## Step change callback

::: code-group
```vue [Vue]
<template>
  <FormRenderer
    :definition="definition"
    @step-change="(stepId, direction) => console.log(stepId, direction)"
    @submit="onSubmit"
  />
</template>
```

```tsx [React]
<FormRenderer
  definition={definition}
  onStepChange={(stepId, direction) => console.log(stepId, direction)}
  onSubmit={handleSubmit}
/>
```
:::

`direction` is `'next'` or `'back'`.

## Async step validation

Need to check something on the server before advancing? See the [Async Step Validation](/guide/async-validation) guide.

## getSubmitValues

On submit, all visible fields across all visible steps are returned. Fields in hidden steps are excluded.

## Next steps

- [Async Step Validation](/guide/async-validation): server-side checks between steps
- [Conditional Fields](/guide/conditions): make steps and fields conditional
- [Error Handling](/guide/errors): handle errors from multi-step submissions
- [Custom Actions & Progress](/guide/custom-components): replace buttons and step progress with your own components
- [Examples](/guide/examples): multi-step patterns in practice
