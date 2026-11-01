---
title: "Unsaved changes"
description: "Track unsaved changes in a Formhaus form with the opt-in dirty module: dirty state, changed field paths, markClean after a save and reset to new values."
---

# Unsaved Changes

`@formhaus/core/dirty` tells whether the form differs from the values it started with, and which fields changed. It is opt-in, so forms that do not use it do not ship it.

::: code-group
```tsx [React]
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { useFormDirty } from '@formhaus/react/dirty';

function Settings({ saved }: { saved: Record<string, unknown> }) {
  const form = useRef<FormRendererHandle>(null);
  const { dirty, dirtyKeys, markClean } = useFormDirty(form);
  return (
    <>
      <FormRenderer
        ref={form}
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

const form = ref<InstanceType<typeof FormRenderer>>();
const { dirty, dirtyKeys, markClean } = useFormDirty(form);

async function submit(values: Record<string, unknown>) {
  await save(values);
  markClean();
}
</script>

<template>
  <FormRenderer ref="form" :definition="definition" :initial-values="saved" @submit="submit" />
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

`useFormDirty` takes the renderer ref, a `FormEngine` or, in Vue, the result of `useFormEngine`.

## What counts as a change

The tracker compares the [submit values](/spec#submit-payload) with a baseline: the initial values when it starts.

- Editing a field back to its baseline makes it clean again.
- A trim-only edit stays clean, since the submit values are trimmed.
- A field hidden by a condition drops out of the submit values and counts as changed, unless `hiddenValues` is `'keep'`.
- Adding or removing a group item lists the group key. An edit inside an item lists the item path, such as `people.1.email`.
- After `replaceDefinition`, the values are compared with the same baseline. A new field with a `defaultValue` and a removed field with a value count as changed.

`dirtyKeys` is sorted in code unit order.

## Save and reset

| Call | Baseline after it |
|---|---|
| `markClean()` | the current values. Call it after a successful save |
| `reset(values?)` | `values`, or the defaults without them. It resets the form too |

`handle.reset()` and `engine.reset()` move the baseline the same way.

## API

| `trackDirty(engine)` | Description |
|---|---|
| `dirty` | `true` when `dirtyKeys` is not empty |
| `dirtyKeys` | Changed field paths. The same array until the keys change |
| `markClean()` | Takes the current values as the baseline |
| `reset(values?)` | Calls `engine.reset(values)`. Any engine reset takes the result as the baseline |
| `subscribe(listener)` | Runs the listener when `dirtyKeys` changes. Returns an unsubscribe function |
| `stop()` | Stops following the engine |

`useFormDirty` returns `dirty`, `dirtyKeys`, `markClean` and `reset`. In Vue, `dirty` and `dirtyKeys` are computed refs. It follows a new engine when the renderer creates one, with a new baseline. Added in 1.9.0.
