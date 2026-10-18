---
title: "Quiz or lead-capture funnel in React or Vue"
description: "Build a quiz or lead-capture funnel with Formhaus: one-click radio answers with autoAdvance, routes per answer, lead saving and form events."
---

# How do I build a quiz or lead-capture funnel?

Formhaus describes the funnel as a multi-step JSON definition: radio questions with `autoAdvance: true` move on as soon as the visitor clicks an answer, `routes` send each answer to its next question, and a contact step collects the lead. `FormRenderer` reports every step and field event through `onFormEvent`, and lifecycle hooks save the lead before the visitor reaches the last step.

## Definition

The plan quiz from [`examples/react-quiz`](https://github.com/ignsm/formhaus/tree/main/examples/react-quiz). Team visitors get an extra question about team size, solo visitors skip it.

<<< @/../examples/react-quiz/src/quiz.json

## React

```tsx
import { FormRenderer } from '@formhaus/react';
import { parseDefinition, type StepChangeContext } from '@formhaus/core';
import { useRef } from 'react';
import quiz from './quiz.json';
import { saveLead } from './api';
import { track } from './analytics';

const definition = parseDefinition(quiz);

export function PlanQuiz() {
  const leadId = useRef<string | null>(null);

  async function captureLead({ fromStepId, reason, values }: StepChangeContext) {
    if (fromStepId !== 'contact' || reason === 'back') return;
    leadId.current = await saveLead(leadId.current, values);
  }

  return (
    <FormRenderer
      definition={definition}
      onBeforeStepChange={captureLead}
      onFormEvent={(event) => track(event.type, event)}
      onSubmit={async (values) => {
        leadId.current = await saveLead(leadId.current, values);
      }}
    />
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { parseDefinition, type StepChangeContext } from '@formhaus/core';
import quiz from './quiz.json';
import { saveLead } from './api';
import { track } from './analytics';

const definition = parseDefinition(quiz);
let leadId: string | null = null;

async function captureLead({ fromStepId, reason, values }: StepChangeContext) {
  if (fromStepId !== 'contact' || reason === 'back') return;
  leadId = await saveLead(leadId, values);
}

async function bookCall(values: Record<string, unknown>) {
  leadId = await saveLead(leadId, values);
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :on-before-step-change="captureLead"
    @submit="bookCall"
    @form-event="(event) => track(event.type, event)"
  />
</template>
```

## How it works

- Each question step has `"next": false` and one radio with `"autoAdvance": true`. Clicking an answer or pressing Space or Enter validates the step and moves on. Arrow keys only select.
- `routes` on `audience` send `team` to the `team` step and everyone else to `goal`. The `team` step routes back to `goal`, so both paths converge.
- Progress counts the active path: four steps for solo visitors, five for teams.
- `onBeforeStepChange` runs after the contact step validates. Saving the lead there captures the email before the optional phone step. When the save throws, the visitor stays on the step and the error goes to `onError`, or above the form when `onError` is not set.
- `onSubmit` updates the same lead id, so Back and Continue never create a second lead.
- `onFormEvent` reports every step view, step completion and skip, field focus and blur, validation error and submit result. Feed them to your analytics tool to build the funnel report.
- The final step never auto-submits, even with `autoAdvance` radios.

## Related

- [Multi-Step Forms](/guide/steps#advance-when-an-answer-is-activated): `autoAdvance`, `next: false` and lifecycle hooks
- [Custom Actions & Progress](/guide/custom-components#form-events): form events
- [Multi-step branching](/recipes/multi-step-branching): routes with Continue buttons and a skip step
- [Examples README](https://github.com/ignsm/formhaus/tree/main/examples): run the quiz locally
