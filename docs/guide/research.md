---
title: "Research"
description: "Opt-in research features for Formhaus surveys: random option order per respondent with pinned options, from the @formhaus/core/research entry."
---

# Research

`@formhaus/core/research` adds survey method features to the engine. Today it shuffles answer options per respondent.

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';
import { research } from '@formhaus/core/research';

<FormRenderer definition={definition} research={research} seed={sessionId} onSubmit={submit} />;
```

```vue [Vue]
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { research } from '@formhaus/core/research';
</script>

<template>
  <FormRenderer :definition="definition" :research="research" :seed="sessionId" @submit="submit" />
</template>
```

```ts [Engine]
import { FormEngine } from '@formhaus/core';
import { research } from '@formhaus/core/research';

const engine = new FormEngine(definition, {}, { research, seed: sessionId });
```
:::

In Vue, warnings arrive through the `@warning` event: `<FormRenderer @warning="onWarning" ... />`.

`useFormEngine` and `HeadlessFormRenderer` take the same `research` and `seed` options. Without `research`, the bundle stays smaller and options show in written order. In development, a definition with `randomize` then reports `missing-research` through `onWarning`, or the console without it. It is reported once per page load (or Node process), not per engine. Formhaus Cloud hosted pages and embeds shuffle the options and store the [order each respondent saw](/cloud/submissions#option-order) with the response.

## Random option order

Set `"randomize": true` on a `radio`, `multiselect` or `select` field. `"pinned": true` keeps an option in its written place. Exclusive options always stay in place. Requires `"formatVersion": "1.6"` and `@formhaus/core` 1.1.

```json
{
  "key": "tools",
  "type": "multiselect",
  "label": "Which tools did you use last month?",
  "randomize": true,
  "options": [
    { "value": "figma", "label": "Figma" },
    { "value": "sketch", "label": "Sketch" },
    { "value": "framer", "label": "Framer" },
    { "value": "other", "label": "Other", "pinned": true },
    { "value": "none", "label": "None of these", "exclusive": true }
  ]
}
```

- The order comes from `seed`. On one engine it stays the same through Back, re-renders, `reset()` and `replaceDefinition()`. A renderer given a new `definition` without `keepValues` builds a new engine, so pass `seed`, such as a session id, to keep the order then and for a returning respondent.
- Without `seed`, or with an empty one, the research module generates one per engine. `engine.seed` returns it.
- `engine.orderOptions(key)` returns the options in shown order, so you can store it with the answers. For a group field, pass `group.field`.
- Values, conditions and validation do not change. Fields in a matrix section keep the written order.
- On the server without `seed`, the renderers show the written order and shuffle after hydration. Pass a per-visitor `seed` to render the shown order on the server too.

The order algorithm is part of the [specification](/spec#option-order), so the Swift port shows the same order for the same seed.
