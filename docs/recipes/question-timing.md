---
title: "Measure time per question in React or Vue"
description: "Measure how long visitors spend on each question of a Formhaus form with form events: step_viewed, form_submitted and form_submit_failed."
---

# How do I measure time per question?

Listen to form events and time the gap between one `step_viewed` and the next. The form library only reports events; the timer below is your code.

## Definition

One question per step:

<<< @/recipes/definitions/survey.json

## Timer

Save as `question-timing.ts`:

<<< @/recipes/snippets/question-timing.ts

## React

```tsx
import { FormRenderer } from '@formhaus/react';
import { parseDefinition } from '@formhaus/core';
import survey from './survey.json';
import { questionTimer } from './question-timing';
import { track } from './analytics';
import { save } from './api';

const definition = parseDefinition(survey);
const timer = questionTimer((stepId, ms) => track('question_time', { stepId, ms }));

export function Survey() {
  return <FormRenderer definition={definition} onSubmit={save} onFormEvent={timer} />;
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { parseDefinition } from '@formhaus/core';
import survey from './survey.json';
import { questionTimer } from './question-timing';
import { track } from './analytics';
import { save } from './api';

const definition = parseDefinition(survey);
const timer = questionTimer((stepId, ms) => track('question_time', { stepId, ms }));
</script>

<template>
  <FormRenderer :definition="definition" @submit="save" @form-event="timer" />
</template>
```

## Without a renderer

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, {}, { onFormEvent: timer });
engine.start();
```

Call `start()` when the form is on screen. It reports `form_viewed` and the first `step_viewed` once.

## How it works

- `step_viewed` fires for the first step and for every later step change: Continue, Back, Skip, auto-advance, a jump to an error and a reset.
- `form_submitted` ends the last question. `form_submit_failed` restarts its clock, because the visitor stays on it.
- A question the visitor returns to is reported again. Sum the reports per `stepId` for the total.
- For several questions on one step, time `field_focused` to `field_blurred` the same way.
- The timer is a plain function, so it works with any analytics tool and with no tool at all.

## Related

- [Form events](/guide/custom-components#form-events): every event and its payload
- [Quiz funnel](/recipes/quiz-funnel): one-click questions with `autoAdvance`
- [Headless engine](/recipes/headless-engine): `FormEngine` without React or Vue
