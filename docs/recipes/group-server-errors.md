---
title: "Server errors on repeatable group items"
description: "Map server error paths such as endings[2].message to the item field of a Formhaus repeatable group, with root errors in formErrors. React and Vue."
---

# How do I show a server error on one item of a repeatable group?

Item errors use the path `<group>.<index>.<field>` with a 0-based index, such as `endings.2.message`. A server that reports `endings[2].message`, or the schema issue path `['endings', 2, 'message']`, needs one conversion before the error reaches [`setErrors()`](/api/form-engine#values-and-validation) or a [submit result](/guide/errors#submit-results). An error without a path belongs to the whole form.

## Adapter

```ts
type Issue = { path?: string | ReadonlyArray<string | number>; message: string };

export function fieldPath(path: Issue['path'] = []): string {
  const segments = typeof path === 'string' ? path.split(/[.[\]]+/).filter(Boolean) : path;
  return segments.join('.');
}

export function splitIssues(issues: Issue[]) {
  const errors: Record<string, string> = {};
  const formErrors: string[] = [];
  for (const { path, message } of issues) {
    const key = fieldPath(path);
    if (key) errors[key] ??= message;
    else formErrors.push(message);
  }
  return { errors, formErrors };
}
```

`fieldPath('endings[2].message')` and `fieldPath(['endings', 2, 'message'])` both return `endings.2.message`. The first message of a field wins. `formErrors` show above the buttons.

## Submit handler

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';
import type { SubmitResult } from '@formhaus/core';
import { splitIssues } from './server-errors';

async function submit(values: Record<string, unknown>): Promise<SubmitResult> {
  const response = await fetch('/api/quizzes', { method: 'POST', body: JSON.stringify(values) });
  if (response.status === 422) return { ok: false, ...splitIssues((await response.json()).issues) };
  if (!response.ok) throw new Error('Could not save the quiz');
  return { ok: true };
}

<FormRenderer definition={definition} onSubmit={submit} />
```

```vue [Vue]
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import type { SubmitResult } from '@formhaus/core';
import { splitIssues } from './server-errors';

async function submit(values: Record<string, unknown>): Promise<SubmitResult> {
  const response = await fetch('/api/quizzes', { method: 'POST', body: JSON.stringify(values) });
  if (response.status === 422) return { ok: false, ...splitIssues((await response.json()).issues) };
  if (!response.ok) throw new Error('Could not save the quiz');
  return { ok: true };
}
</script>

<template>
  <FormRenderer :definition="definition" @submit="submit" />
</template>
```
:::

The error lands on the Message field of the third item, and the form opens its step and focuses the field. An item that the user removed since the request has no field for its path, so that message shows above the buttons.

## Without a submit result

Pass the converted object to `engine.setErrors()`, or to the `errors` prop of the renderer:

```ts
engine.setErrors(splitIssues(issues).errors);
```

`setErrors()` and `errors` take field errors only. Show `formErrors` yourself, or return them in a submit result.

## Schema issues

[`schemaValidate()` and `schemaParse()`](/guide/schema-validation#group-items) already place a client issue with the path `['endings', 2, 'message']` on `endings.2.message`. Convert only when your server runs the schema and returns the issues. Use the same adapter: `issue.path` is the array form that `fieldPath()` accepts, and an issue without a path becomes a form error.
