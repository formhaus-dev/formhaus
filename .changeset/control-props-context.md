---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- Control `props` callbacks in `mapControls` receive a third argument `{ kind, field, anchors }`, with the field definition and the scale anchors.
- New `f.loading` is `true` while the options provider of the field runs or `setFieldLoading(key, true)` is active. `f.disabled` keeps its meaning.
- New `f.freeText` gives `text` and `setText(text)` for an input that takes typed text, with the same rules as the built-in `autocomplete`.
- New `useFieldProps(props)` hook in React keeps the typed text of `f.freeText` between renders.
- `mapControls` with `freeText` shows options with the same label as `Label (value)`, as the built-in `autocomplete` does, so each one can be picked. Before, the first one always won.
- New `freeText()` helper and `FreeText` type in `@formhaus/core/fields`, and `ControlContext` type in the `/controls` entries.
