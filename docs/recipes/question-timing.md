---
title: "Measure time per question in React or Vue"
description: "Measure how long visitors spend on each question of a Formhaus form with form events: step_viewed, form_submitted and form_submit_failed."
---

# How do I measure time per question?

Listen to form events and time each question from its `step_viewed` to the next step, the submit or the visitor leaving. The form library only reports events. The timer below is your code.

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
import { useEffect, useMemo } from 'react';
import survey from './survey.json';
import { questionTimer, watchPage } from './question-timing';
import { track } from './analytics';
import { save } from './api';

const definition = parseDefinition(survey);

export function Survey() {
  const timer = useMemo(() => questionTimer((time) => track('question_time', time)), []);
  useEffect(() => watchPage(timer), [timer]);
  return <FormRenderer definition={definition} onSubmit={save} onFormEvent={timer.onEvent} />;
}
```

## Vue

```vue
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { parseDefinition } from '@formhaus/core';
import { onBeforeUnmount, onMounted } from 'vue';
import survey from './survey.json';
import { questionTimer, watchPage } from './question-timing';
import { track } from './analytics';
import { save } from './api';

const definition = parseDefinition(survey);
const timer = questionTimer((time) => track('question_time', time));
let stop = () => {};
onMounted(() => (stop = watchPage(timer)));
onBeforeUnmount(() => stop());
</script>

<template>
  <FormRenderer :definition="definition" @submit="save" @form-event="timer.onEvent" />
</template>
```

## Without a renderer

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition, {}, { onFormEvent: timer.onEvent });
engine.start();
```

Call `start()` when the form is on screen. It reports `form_viewed` and the first `step_viewed` once per engine.

## How it works

- Each mounted form gets its own timer. `form_viewed` clears it, so a remount or a new definition starts from zero.
- `step_viewed` fires for the first step and for every later step change: Continue, Back, Skip, auto-advance, a jump to an error and a reset.
- `form_submitted` ends the last question. `form_submit_failed` restarts its clock, because the visitor stays on it.
- `field_focused` to `field_blurred` gives the time spent in each field. Those reports carry `fieldKey`.
- `watchPage` pauses both clocks while the tab is hidden and reports the open question on `pagehide`, so abandoned questions are counted.
- A question the visitor returns to is reported again. Sum the reports per `stepId` for the total.

## Related

- [Form events](/guide/custom-components#form-events): every event and its payload
- [Quiz funnel](/recipes/quiz-funnel): one-click questions with `autoAdvance`
- [Headless engine](/recipes/headless-engine): `FormEngine` without React or Vue
