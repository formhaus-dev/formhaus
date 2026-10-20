---
title: "Server-side validation"
description: "Validate untrusted submissions on the server with validateSubmission from @formhaus/core/server: types, options, formats, hidden fields and skipped steps."
---

# Server-side validation

`validateSubmission()` from `@formhaus/core/server` checks a submitted payload against the same JSON definition the browser renders.

```bash
npm install @formhaus/core
```

## Express

```ts
import express from 'express';
import { parseDefinition } from '@formhaus/core';
import { validateSubmission } from '@formhaus/core/server';
import json from './definition.json' with { type: 'json' };

const definition = parseDefinition(json);
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

Post the values and the skipped step ids. Return the `422` errors as a [submit result](/guide/errors#submit-results).

::: code-group
```tsx [React]
import type { SubmitResult } from '@formhaus/core';

async function submit(values: Record<string, unknown>, skippedSteps: string[]): Promise<SubmitResult> {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values, skippedSteps }),
  });
  if (response.status === 422) return { ok: false, errors: (await response.json()).errors };
  if (!response.ok) throw new Error('Could not save the form');
  return { ok: true };
}

<FormRenderer definition={definition} onSubmit={submit} />
```

```vue [Vue]
<script setup lang="ts">
import type { SubmitResult } from '@formhaus/core';

async function submit(values: Record<string, unknown>, skippedSteps: string[]): Promise<SubmitResult> {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values, skippedSteps }),
  });
  if (response.status === 422) return { ok: false, errors: (await response.json()).errors };
  if (!response.ok) throw new Error('Could not save the form');
  return { ok: true };
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="submit" />
</template>
```
:::

The second argument of `validateSubmission()` is the values object, not the whole request body. Passing the body adds an error under the `values` key that says so.

## What it checks

Both run the `validation` rules on the active path and skip fields and steps hidden by conditions and inactive branches. Both also run the same type checks for built-in types: `email`, `date` (`YYYY-MM-DD`), `datetime` (ISO 8601) and `time` (`HH:mm`) formats, booleans for `checkbox` and `switch`, whole numbers in range for `scale` and `rating`, static `options` for `select`, `radio` and `multiselect`, and the 10,000 character cap on text, 2000 on `hidden` fields without `maxLength`. Both skip the `options` check on fields with `optionsFrom`, so validate dynamic lists in your app. The browser also skips `file` fields. The returned `values` hold only fields on the active path; unknown keys are dropped. A missing key stays missing: `validateSubmission()` applies no `defaultValue`, `defaultItems` or item field default to it. The fields of a step in `skippedSteps` are reset as Skip resets them in the browser: values sent for them are ignored, and conditions see their `defaultValue`. `validateSubmission()` also handles what a browser cannot be trusted to send:

| Behavior | `validateSubmission()` | `FormEngine.validate()` |
|---|---|---|
| Steps in `skippedSteps` dropped, only when the step has `skip` | Yes | No |
| `number`, `scale` and `rating` decimal string such as `"5"` converted to a number | Yes | No. The string fails the type check |
| `[]` in a built-in field other than `multiselect` dropped like a missing answer | Yes | No. It counts as empty and stays in the payload |
| A value that fails its type check, at top level or in a group item, left out of `values` and treated as unanswered by conditions and validators | Yes | No. It stays in the payload and conditions see it |
| Named `validator` functions | Ignored unless passed in `validators` | Yes |

A type error can name a field the user never saw, sent by a stale or tampered client. Pass server errors back through a rejected submit or `setErrors()`, which shows errors of fields that are not on screen as form-level errors, or show them at form level yourself.

`FormEngine.validate()` is the browser check. Do not use it on untrusted input.

For a [repeatable group](/guide/groups), a value with more items than `maxLength` fails with the `maxItems` message, and a value that is not an array of plain objects, or that has more than 100 items without `maxLength`, fails with the `value` message. Both are rejected before any item is checked, and the value is left out of `values`. It drops unknown item keys and checks every visible item field. Item errors use paths such as `participants.1.email`, and `values` holds the cleaned arrays. Upgrade the server before the clients: core 0.13 and older pass a group value through without checks.

## Custom validators

`validateSubmission()` ignores `validation.validator` unless you pass the function in `validators`:

```ts
import type { ValidatorFn } from '@formhaus/core';

const validators: Record<string, ValidatorFn> = {
  companyAvailable: (value) => (String(value).toLowerCase() === 'acme' ? 'This company already has a workspace' : null),
};

const { values, errors } = validateSubmission(definition, req.body?.values, {
  skippedSteps: req.body?.skippedSteps,
  validators,
});
```

Validators run only for fields on the active path, never on an empty value.

## Messages

Errors use `definition.messages`. Pass `messages` to override them, such as with the messages of a [localized](/guide/translations#server) definition:

```ts
const { errors } = validateSubmission(definition, req.body?.values, { messages: { required: 'Pflichtfeld' } });
```

## Limits

- `pattern` rules run on untrusted input. Bound the execution time of the call, or keep patterns simple.
- `pattern` regexes run synchronously, with no time limit, in the browser and in self-hosted servers. Avoid patterns prone to catastrophic backtracking. On Formhaus Cloud, server-side validation is time-bounded.
- `validateSubmission()` does not limit the request body. Set a limit in your framework or proxy.
- Submitted values and recalled answers are user input. Encode them for each output before use: see [Output safety](/guide/fields#output-safety).

## Check a definition

`checkDefinition()` returns a list of issues, for example before you store a definition an agent wrote. Each issue has a `code`, a `severity` of `error` or `warning`, a JSON pointer `path`, and a `message`:

```ts
import { checkDefinition } from '@formhaus/core/server';

const errors = checkDefinition(definition).filter((issue) => issue.severity === 'error');
```

## Embedded runtimes

`@formhaus/core/server.iife.js` exposes `validateSubmission` and `checkDefinition` on a `Formhaus` global, for JS runtimes without module loading.
