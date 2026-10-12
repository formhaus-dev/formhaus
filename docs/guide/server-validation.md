---
description: "Validate untrusted form submissions on the server with validateSubmission from @formhaus/core/server: value types, options, email and date formats, hidden and skipped steps, unknown keys."
---

# Server-side validation

`validateSubmission()` from `@formhaus/core/server` checks a submitted payload against the same JSON definition the browser renders.

```bash
npm install @formhaus/core
```

## Express

```ts
import express from 'express';
import type { FormDefinition } from '@formhaus/core';
import { validateSubmission } from '@formhaus/core/server';
import json from './definition.json' with { type: 'json' };

const definition = json as FormDefinition;
const app = express();
app.use(express.json({ limit: '100kb' }));

app.post('/api/submit', (req, res) => {
  const { values, errors } = validateSubmission(definition, req.body?.values, {
    skippedSteps: req.body?.skippedSteps,
  });
  if (Object.keys(errors).length > 0) return res.status(422).json({ errors });
  res.json({ values });
});

app.listen(3000);
```

Save `values`, not `req.body.values`. `validateSubmission()` throws a `FormDefinitionError` when the definition itself has an error, so check stored definitions with `checkDefinition()` before you save them. Next.js and Nuxt versions are in [Next.js](/guide/integrations/nextjs) and [Nuxt](/guide/integrations/nuxt).

## Client

Post the values and the skipped step ids. Pass the `422` errors back through the `errors` prop.

::: code-group
```tsx [React]
const [errors, setErrors] = useState<Record<string, string>>();

async function submit(values: Record<string, unknown>, skippedSteps?: string[]) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values, skippedSteps }),
  });
  if (response.status === 422) setErrors((await response.json()).errors);
}

<FormRenderer definition={definition} errors={errors} onSubmit={submit} />
```

```vue [Vue]
<script setup lang="ts">
const errors = ref<Record<string, string>>();

async function submit(values: Record<string, unknown>, skippedSteps?: string[]) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values, skippedSteps }),
  });
  if (response.status === 422) errors.value = (await response.json()).errors;
}
</script>

<template>
  <FormRenderer :definition="definition" :errors="errors" @submit="submit" />
</template>
```
:::

The second argument of `validateSubmission()` is the values object, not the whole request body. Passing the body returns "This field is required" for every required field.

## What it checks

Both run the `validation` rules on the active path and skip hidden fields, hidden steps and inactive branches. The returned `values` hold only fields on the active path; unknown keys are dropped. `validateSubmission()` also checks what a browser cannot be trusted to send:

| Check | `validateSubmission()` | `FormEngine.validate()` |
|---|---|---|
| Steps in `skippedSteps` dropped, only when the step has `skip` | Yes | No |
| `number` takes a number or a decimal string, returned as a number | Yes | No. `"5"` skips `min` and `max` |
| `checkbox` and `switch` take booleans | Yes | No |
| `select` and `radio` values come from `options`, `multiselect` takes an array of them | Yes | No |
| `email`, `date` (`YYYY-MM-DD`) and `datetime` (ISO 8601) formats | Yes | No |
| Strings over 10,000 characters or `maxLength` rejected before other rules | Yes | No |
| Named `validator` functions | Ignored | Yes |

`FormEngine.validate()` is the browser check. Do not use it on untrusted input.

The `email` format is checked only by `validateSubmission()`. To check it in the browser too, add a `pattern` to the field.

## Custom validators

`validateSubmission()` ignores `validation.validator`. Run your server validators on the returned values:

```ts
import type { ValidatorFn } from '@formhaus/core';

const validators: Record<string, ValidatorFn> = {
  companyAvailable: (value) => (String(value).toLowerCase() === 'acme' ? 'This company already has a workspace' : null),
};

function runValidators(values: Record<string, unknown>, errors: Record<string, string>) {
  const fields = definition.steps?.flatMap((step) => step.fields) ?? definition.fields ?? [];
  for (const field of fields) {
    const validate = validators[field.validation?.validator ?? ''];
    const value = values[field.key];
    if (!validate || errors[field.key] || value === undefined || value === '') continue;
    const error = validate(value, values);
    if (error) errors[field.key] = error;
  }
}

const { values, errors } = validateSubmission(definition, req.body?.values, { skippedSteps: req.body?.skippedSteps });
runValidators(values, errors);
```

`values` holds only fields on the active path, so validators of hidden fields do not run.

## Limits

- `pattern` rules run on untrusted input. Bound the execution time of the call, or keep patterns simple.
- `validateSubmission()` does not limit the request body. Set a limit in your framework or proxy.

## Check a definition

`checkDefinition()` returns a list of issues, for example before you store a definition an agent wrote. Each issue has a `code`, a `severity` of `error` or `warning`, a JSON pointer `path`, and a `message`:

```ts
import { checkDefinition } from '@formhaus/core/server';

const errors = checkDefinition(definition).filter((issue) => issue.severity === 'error');
```

## Embedded runtimes

`@formhaus/core/server.iife.js` exposes `validateSubmission` and `checkDefinition` on a `Formhaus` global, for JS runtimes without module loading.
