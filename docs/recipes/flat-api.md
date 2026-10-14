---
title: "Multi-step form on an existing flat API"
description: "Send a Formhaus multi-step form as one flat API request, map field names both ways and show server errors on the right step without changing the backend."
---

# How do I connect a multi-step form to an existing flat API?

Formhaus keeps the answers of every step in one flat object, so a multi-step form can post to an endpoint that expects a single object. Write two plain functions next to your HTTP call: one renames the keys for the request, the other turns the response into a [submit result](/guide/errors#submit-results). The backend stays as it is.

The complete app is the [`react-flat-api` example](https://github.com/ignsm/formhaus/tree/main/examples/react-flat-api). Its mock API rejects answers on the first and the last step in one response.

## Definition

<<< @/../examples/react-flat-api/src/account.json

## Adapter

The API names the fields `first_name` and `postal_code` and answers `422` with `{ errors: { first_name: ['Use letters only'] } }`. The adapter maps the keys out and back:

```ts
import type { SubmitResult } from '@formhaus/core';

const apiKeys: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  accountType: 'account_type',
  companyName: 'company_name',
  street: 'street',
  postcode: 'postal_code',
};
const formKeys = Object.fromEntries(Object.entries(apiKeys).map(([form, api]) => [api, form]));

export function toRequest(values: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [apiKeys[key] ?? key, value]));
}

export async function submitAccount(values: Record<string, unknown>): Promise<SubmitResult> {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRequest(values)),
  });
  if (response.ok) return { ok: true };
  const body = await response.json().catch(() => ({}));
  if (response.status !== 422 || !body.errors) return { ok: false, formErrors: [body.message ?? 'We could not open your account'] };
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries<string[]>(body.errors)) errors[formKeys[key] ?? key] = messages.join(' ');
  return { ok: false, errors };
}
```

`toRequest()` receives only the answers on the active path, so a hidden `companyName` is never sent. An error key with no mapping, such as `account`, passes through unchanged and shows above the buttons. When `fetch` itself fails, the function throws: the form keeps the answers and shows the failure.

## React

```tsx
import { FormRenderer } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import account from './account.json';
import { submitAccount } from './adapter';

const definition = parseDefinition(account);

export function AccountForm({ onOpened }: { onOpened: (email: string) => void }) {
  return (
    <FormRenderer
      definition={definition}
      onSubmit={submitAccount}
      onAfterSubmit={(values) => onOpened(String(values.email))}
      errorSummary
      stepErrorMarks
    />
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { parseDefinition } from '@formhaus/core';
import account from './account.json';
import { submitAccount } from './adapter';

const definition = parseDefinition(account);
const emit = defineEmits<{ opened: [email: string] }>();
</script>

<template>
  <FormRenderer
    :definition="definition"
    @submit="submitAccount"
    :on-after-submit="(values) => emit('opened', String(values.email))"
    error-summary
    step-error-marks
  />
</template>
```

## What the user sees

1. The user fills three steps and submits once. The API gets one flat object.
2. The API rejects `first_name` and `postal_code`. The form opens the first step, focuses First name, and keeps every answer. The summary links to both fields and the step list marks both steps.
3. The user fixes First name. Its error goes; the postcode error stays on the last step.
4. The user fixes the postcode and submits again. `onAfterSubmit` runs once.

Errors that arrive for a field the user has edited since the request was sent are dropped. A second click while the request runs sends nothing. If the form unmounts first, the response is ignored. The full rules are in the [specification](/spec#submit-results).
