---
title: "Computed values: recall a calculated total"
description: "Store a calculated total in a hidden field, show it in a later step with {{total}} and branch on it with a gte condition. Formhaus React and Vue renderers."
---

# How do I use a calculated value later in the form?

Compute the value in app code, write it to a `hidden` field with `setValue`, then recall it with `{{total}}` and use it in conditions. Requires `@formhaus/core` 0.21 and `formatVersion` `"1.5"`.

## Definition

A booking that adds two seat counts into `total`. The next step shows it and asks for a group request from 10 seats.

<<< @/recipes/definitions/booking-total.json

A `hidden` field holds text, so write the sum as a string. `gte` compares it as a number.

## React

```tsx
import { useRef } from 'react';
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import booking from './booking-total.json';

const definition = parseDefinition(booking);

export function BookingForm({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  return (
    <FormRenderer
      ref={form}
      definition={definition}
      onSubmit={onDone}
      onValuesChange={(values) => {
        const total = String(Number(values.adults ?? 0) + Number(values.children ?? 0));
        if (values.total !== total) form.current?.setValue('total', total);
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
import booking from './booking-total.json';

const definition = parseDefinition(booking);
const emit = defineEmits<{ done: [values: Record<string, unknown>] }>();
const form = ref<FormRendererHandle>();

function onValuesChange(values: Record<string, unknown>) {
  const total = String(Number(values.adults ?? 0) + Number(values.children ?? 0));
  if (values.total !== total) form.value?.setValue('total', total);
}
</script>

<template>
  <FormRenderer ref="form" :definition="definition" @values-change="onValuesChange" @submit="(values) => emit('done', values)" />
</template>
```

## How it works

- `onValuesChange` fires on mount and after every change, so `total` is set before the user reaches the next step.
- Write only when the value differs, so the callback does not trigger itself.
- `{{total}}` is replaced in labels, descriptions, helper texts, placeholders and step titles. See [Answer recall](/guide/fields#answer-recall).
- The computation needs app code. A form published as JSON only, such as a hosted form, cannot compute values.

## Related

- [Derived values](/recipes/derived-values): fill one field from another and read totals
- [Conditional fields](/recipes/conditional-fields): `show` and `gte`
