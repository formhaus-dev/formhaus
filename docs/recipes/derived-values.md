---
title: "Derived values: fill a form field from another"
description: "Set a Formhaus field from app code, such as a due date 14 days after the issue date, and stop once the user edits it. React and Vue renderer handle."
---

# How do I fill a field from another field until the user edits it?

Listen to `onFieldChange` (React) or `fieldChange` (Vue) and write the derived value with `setValue` on a ref to the renderer. Track in app code whether the user has edited the derived field, and stop writing once they have.

## Definition

An invoice with a due date that follows the issue date by 14 days.

<<< @/recipes/definitions/invoice.json

## React

```tsx
import { useRef } from 'react';
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import invoice from './invoice.json';

const definition = parseDefinition(invoice);

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function InvoiceForm({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  const dueDateEdited = useRef(false);

  return (
    <FormRenderer
      ref={form}
      definition={definition}
      onSubmit={onDone}
      onFieldChange={(key, value) => {
        if (key === 'dueDate') dueDateEdited.current = true;
        if (key === 'issueDate' && !dueDateEdited.current && typeof value === 'string' && value)
          form.current?.setValue('dueDate', addDays(value, 14));
      }}
    />
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { FormRenderer, type FormRendererHandle } from '@formhaus/vue';
import { parseDefinition } from '@formhaus/core';
import invoice from './invoice.json';

const definition = parseDefinition(invoice);
const emit = defineEmits<{ done: [values: Record<string, unknown>] }>();
const form = ref<FormRendererHandle>();
let dueDateEdited = false;

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function onFieldChange(key: string, value: unknown) {
  if (key === 'dueDate') dueDateEdited = true;
  if (key === 'issueDate' && !dueDateEdited && typeof value === 'string' && value)
    form.value?.setValue('dueDate', addDays(value, 14));
}
</script>

<template>
  <FormRenderer ref="form" :definition="definition" @field-change="onFieldChange" @submit="(values) => emit('done', values)" />
</template>
```

## How it works

- `onFieldChange` fires for user edits only. `setValue` from the handle does not fire it, so the derived write never marks the due date as edited.
- The first edit of `dueDate` sets `dueDateEdited`, and later issue dates leave the due date alone.
- `setValue` runs the same visibility and validation updates as typing. A value for a field hidden by its conditions is cleared at once.
- `getValues()` returns a shallow copy of the current values. Group items are the live arrays, so change them with `setValue`.
- The handle works the same on `HeadlessFormRenderer`.
- To restore derived values with a draft, save `dueDateEdited` next to the draft.

## Related

- [Getting started](/guide/#definition-and-initial-values): `initialValues` and the renderer handle
- [Conditional fields](/recipes/conditional-fields): show fields based on other answers
- [FormEngine](/api/form-engine#values-and-validation): `setValue` on the engine
