---
title: "Derived values: invoice totals and due dates"
description: "Show an invoice total that updates on every value change, and fill a due date from the issue date until the user edits it. Formhaus React and Vue renderers."
---

# How do I derive values from what the user enters?

Read `onValuesChange` (React), `@values-change` or the handle's `values` (Vue) for anything computed from the form, such as a total. Use `onFieldChange` (React) or `fieldChange` (Vue) with `setValue` to fill one field from another until the user edits it. Requires `@formhaus/react` or `@formhaus/vue` 0.16.

## Definition

An invoice with line items and a due date that follows the issue date by 14 days.

<<< @/recipes/definitions/invoice.json

## React

```tsx
import { useRef, useState } from 'react';
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import invoice from './invoice.json';

const definition = parseDefinition(invoice);

type Line = { quantity?: number | null; price?: number | null };

function total(lines: unknown) {
  return ((lines as Line[] | undefined) ?? []).reduce((sum, line) => sum + (line.quantity ?? 0) * (line.price ?? 0), 0);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function InvoiceForm({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  const dueDateEdited = useRef(false);
  const [amount, setAmount] = useState(0);

  return (
    <>
      <FormRenderer
        ref={form}
        definition={definition}
        onSubmit={onDone}
        onValuesChange={(values) => setAmount(total(values.lines))}
        onFieldChange={(key, value) => {
          if (key === 'dueDate') dueDateEdited.current = true;
          if (key === 'issueDate' && !dueDateEdited.current && typeof value === 'string' && value)
            form.current?.setValue('dueDate', addDays(value, 14));
        }}
      />
      <p>Total: {amount.toFixed(2)}</p>
    </>
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { FormRenderer, type FormRendererHandle } from '@formhaus/vue';
import { parseDefinition } from '@formhaus/core';
import invoice from './invoice.json';

const definition = parseDefinition(invoice);
const emit = defineEmits<{ done: [values: Record<string, unknown>] }>();
const form = ref<FormRendererHandle>();
let dueDateEdited = false;

type Line = { quantity?: number | null; price?: number | null };

const amount = computed(() =>
  ((form.value?.values.lines as Line[] | undefined) ?? []).reduce((sum, line) => sum + (line.quantity ?? 0) * (line.price ?? 0), 0),
);

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
  <p>Total: {{ amount.toFixed(2) }}</p>
</template>
```

`@values-change="(values) => …"` works too, the same way as `onValuesChange` in React.

## How it works

- `onValuesChange` and `valuesChange` fire once on mount with the initial values, then once for every value-changing operation: user edits, `setValue` from the handle, adding or removing group items, values cleared or restored by conditions, and `reset`. A change that clears several hidden fields fires once. Errors, loading and step navigation do not fire them, and neither does writing a value equal to the current one.
- They may fire when the values end up unchanged: a write to a hidden field, a `reset` to equal content, a skipped step and undoing that skip when the submit fails.
- They fire again when a new `definition` creates a new form. They never fire during server rendering.
- The payload is a frozen shallow copy of the values. Group items are shared with the form, so treat them as read-only and change them with `setValue`.
- In Vue, the handle's `values` is reactive: read it in a `computed` or a template. `useFormEngine().values` is reactive the same way.
- `onFieldChange` fires for user edits only. `setValue` from the handle does not fire it, so the derived write never marks the due date as edited.
- The first edit of `dueDate` sets `dueDateEdited`, and later issue dates leave the due date alone.
- `setValue` runs the same visibility and validation updates as typing. A value for a field hidden by its conditions is cleared at once. A `setValue` inside `onValuesChange` fires a nested `onValuesChange` right away.
- `getValues()` returns a shallow copy of the current values.
- The handle and events work the same on `HeadlessFormRenderer`.
- To restore derived values with a draft, save `dueDateEdited` next to the draft.

## Related

- [Getting started](/guide/#definition-and-initial-values): `initialValues` and the renderer handle
- [Repeatable groups](/guide/groups): line items as group values
- [FormEngine](/api/form-engine#subscriptions): `subscribeValues` and `getValuesSnapshot` on the engine
