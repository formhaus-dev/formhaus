---
title: "Show or hide form fields based on other answers"
description: "Show or hide form fields based on earlier answers with Formhaus show and showAny conditions in JSON. Hidden values are cleared and never submitted."
---

# How do I show or hide fields based on other answers?

In Formhaus you add `show` (all conditions must match) or `showAny` (at least one must match) to a field in the JSON definition. The `FormEngine` re-evaluates visibility on every change, clears the values of fields that become hidden, and skips hidden fields in validation and submission. The React and Vue renderers apply this without extra code.

## Definition

A checkout form: company name for business buyers, an invoice email for business buyers or individuals who ask for an invoice, and an address or pickup point depending on delivery.

<<< @/recipes/definitions/checkout-details.json

## React

```tsx
import { FormRenderer } from '@formhaus/react';
import type { FormDefinition } from '@formhaus/core';
import checkout from './checkout-details.json';

const definition = checkout as FormDefinition;

export function CheckoutDetails({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  return <FormRenderer definition={definition} onSubmit={onDone} />;
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import type { FormDefinition } from '@formhaus/core';
import checkout from './checkout-details.json';

const definition = checkout as FormDefinition;
const emit = defineEmits<{ done: [values: Record<string, unknown>] }>();
</script>

<template>
  <FormRenderer :definition="definition" @submit="(values) => emit('done', values)" />
</template>
```

## How it works

- `companyName` has `show: [{ "field": "customerType", "eq": "business" }]` and appears only for business buyers.
- `invoiceEmail` uses `showAny`: it appears when `customerType` is `business` or when `needInvoice` is `true`.
- `address` and `pickupPoint` depend on `delivery`. Only one of them is visible at a time, so only one is required.
- Switching from Business to Individual hides `companyName` and removes its value from the engine. Switching back shows an empty field.
- Cleanup cascades. Switching from Individual to Business hides `needInvoice` and clears it; `invoiceEmail` stays because its business condition still matches.
- Hidden fields are not validated. A required `pickupPoint` does not block submit while Courier is selected.
- `onSubmit` receives only visible values. Operators are `eq`, `neq`, `in`, `notIn` and `notEmpty`.
- Steps accept the same `show` and `showAny` keys. A hidden step is skipped and drops out of the progress count.

## Related

- [Conditional Fields](/guide/conditions): operators, AND/OR rules and conditional submit buttons
- [Multi-step branching](/recipes/multi-step-branching): route between steps with the same conditions
- [Definition Reference](/api/definition#showcondition): the `ShowCondition` type
- [FormEngine](/api/form-engine#values-and-validation): `setValue`, `validate` and `getSubmitValues`
