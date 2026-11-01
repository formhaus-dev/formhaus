---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `@formhaus/core/dirty` entry: `trackDirty(engine)` reports `dirty` and the changed field paths in `dirtyKeys`, with `markClean()` and `reset(values)` to move the baseline.
- New `engine.resetCount` counts `reset()` calls.
- New `useFormDirty` in `@formhaus/react/dirty` and `@formhaus/vue/dirty` takes a renderer ref or an engine.
- New `schemaParse(schema)` in `@formhaus/core/schema` passes the schema output to the submit handler, typed from the schema.
- The renderer handle has `submit()`, `reset(values)`, `submitting` and `engine`.
- The `id` prop goes on the `<form>` element, so a submit button outside the form can submit it.
- React `FormRenderer` and `HeadlessFormRenderer` take a values type argument for `onSubmit`.
