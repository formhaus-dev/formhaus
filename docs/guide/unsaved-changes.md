---
title: "Unsaved changes"
description: "Track unsaved changes in a Formhaus form with the opt-in dirty module: dirty state, changed field paths, markClean after a save and reset to new values."
---

# Unsaved Changes

`@formhaus/core/dirty` tells whether the form differs from the values it started with, and which fields changed. It is opt-in, so forms that do not use it do not ship it.

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';
import { useFormDirty } from '@formhaus/react/dirty';

function Settings({ saved }: { saved: Record<string, unknown> }) {
  const { dirty, dirtyKeys, markClean, ref } = useFormDirty();
  return (
    <>
      <FormRenderer
        ref={ref}
        definition={definition}
        initialValues={saved}
        onSubmit={async (values) => {
          await save(values);
          markClean();
        }}
      />
      {dirty && <p>Unsaved: {dirtyKeys.join(', ')}</p>}
    </>
  );
}
```

```vue [Vue]
<script setup lang="ts">
import { FormRenderer } from '@formhaus/vue';
import { useFormDirty } from '@formhaus/vue/dirty';

const { dirty, dirtyKeys, markClean, ref: formRef } = useFormDirty();

async function submit(values: Record<string, unknown>) {
  await save(values);
  markClean();
}
</script>

<template>
  <FormRenderer :ref="formRef" :definition="definition" :initial-values="saved" @submit="submit" />
  <p v-if="dirty">Unsaved: {{ dirtyKeys.join(', ') }}</p>
</template>
```

```ts [Engine]
import { FormEngine } from '@formhaus/core';
import { trackDirty } from '@formhaus/core/dirty';

const engine = new FormEngine(definition, saved);
const changes = trackDirty(engine);
changes.subscribe(() => toggleSaveButton(changes.dirty));
```
:::

Pass `ref` to the renderer, also from a child such as a dialog body that mounts later. With `useFormEngine`, pass the engine instead: `useFormDirty(engine)`. A renderer handle works too. In Vue it also takes the result of `useFormEngine` or a template ref.

To keep your own handle too, call both in one React ref:

```tsx
<FormRenderer
  ref={(handle) => {
    form.current = handle;
    dirty.ref(handle);
  }}
  definition={definition}
  onSubmit={submit}
/>
```

## What counts as a change

The tracker compares the [submit values](/spec#submit-payload) with a baseline: the initial values when it starts.

- Editing a field back to its baseline makes it clean again.
- A trim-only edit stays clean, since the submit values are trimmed.
- A field hidden by a condition drops out of the submit values and counts as changed, unless `hiddenValues` is `'keep'`.
- Adding or removing a group item lists the group key. An edit inside an item lists the item path, such as `people.1.email`.
- Skipping a step drops its values, so they count as changed until the step is included again.
- `null`, `''` and a missing value all differ. `0` equals `-0`.
- After `replaceDefinition`, the baseline is compared under the new definition, so new fields with defaults and removed fields do not count as changed. Only edits do. To rebuild the definition from app data and keep the baseline, see [Build the definition from app values](/guide/#build-the-definition-from-app-values).

`dirtyKeys` is sorted in code unit order.

## Save and reset

| Call | Baseline after it |
|---|---|
| `markClean()` | the current values. Call it after a successful save |
| `handle.reset(values?)` or `engine.reset(values?)` | `values`, or the defaults without them |

## API

| `trackDirty(engine)` | Description |
|---|---|
| `dirty` | `true` when `dirtyKeys` is not empty |
| `dirtyKeys` | Changed field paths. The same array until the keys change |
| `markClean()` | Takes the current values as the baseline |
| `subscribe(listener)` | Runs the listener when `dirtyKeys` changes. Returns an unsubscribe function |
| `stop()` | Stops following the engine |

`useFormDirty` returns `dirty`, `dirtyKeys`, `markClean` and `ref`. In Vue, `dirty` and `dirtyKeys` are computed refs. It follows a new engine when the renderer creates one, with a new baseline. Added in 1.9.0.
