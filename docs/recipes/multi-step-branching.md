---
title: "Multi-step form with branching in React or Vue"
description: "Build a multi-step form with branching paths in React or Vue: Formhaus step routes, eq conditions, a converge step, an optional skip step and Back."
---

# How do I build a multi-step form with branching in React or Vue?

With Formhaus, the branching lives in the JSON definition: each step lists `routes`, and the first route whose `show` conditions match picks the next step. `FormRenderer` from `@formhaus/react` or `@formhaus/vue` renders the steps, validates each one on Continue, handles Back and Skip, and submits only the answers on the path the user took.

## Definition

The service answer sends the user to a design or a development step. Both branches converge at an optional budget step, then contact details.

<<< @/recipes/definitions/project-inquiry.json

## React

```tsx
import { FormRenderer } from '@formhaus/react';
import type { FormDefinition } from '@formhaus/core';
import inquiry from './project-inquiry.json';

const definition = inquiry as FormDefinition;

export function ProjectInquiry() {
  return (
    <FormRenderer
      definition={definition}
      onStepChange={(stepId, direction) => console.log(stepId, direction)}
      onSubmit={async (values) => {
        await fetch('/api/inquiries', { method: 'POST', body: JSON.stringify(values) });
      }}
    />
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import type { FormDefinition } from '@formhaus/core';
import inquiry from './project-inquiry.json';

const definition = inquiry as FormDefinition;

async function save(values: Record<string, unknown>) {
  await fetch('/api/inquiries', { method: 'POST', body: JSON.stringify(values) });
}
</script>

<template>
  <FormRenderer :definition="definition" :submit-handler="save" />
</template>
```

## How it works

- `routes` on the `service` step are checked in order. `{ "field": "service", "eq": "design" }` sends the user to `design`; the `development` route matches the other answer.
- `design` and `development` each end with `{ "to": "budget" }`. Without that route, `design` would fall through to the next declared step, `development`, and both branches would run.
- Route targets must be later declared steps. Backward targets and unknown step ids throw when the engine is created and are reported by `validateDefinition()`.
- `skip` on `budget` renders a Skip button labelled "Not sure yet". Skip resets the step to its defaults and leaves its fields out of validation and the submitted values.
- `back` on `contact` relabels the Back button. Back follows the path the user took, so from `contact` it returns to `budget`, then to the branch step.
- Progress shows "Step N of 4" for either branch. Before the service is answered the path is provisional.
- Answers from a branch the user left stay in `engine.values` as a draft but are not validated or submitted. Choosing development, filling the platform and switching to design submits `pages`, not `platform`.

## Related

- [Multi-Step Forms](/guide/steps): routes, skip, lifecycle hooks and `autoAdvance`
- [Conditional Fields](/guide/conditions): the `show` and `showAny` operators routes use
- [Async Step Validation](/guide/async-validation): server checks before the next step
- [Definition Reference](/api/definition#step-routes): the `StepRoute` type
- [FormEngine](/api/form-engine#navigation): `nextStepAsync`, `prevStepAsync` and `skipStepAsync`
