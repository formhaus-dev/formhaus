---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- Control `props` in `mapControls` get a third argument `{ kind, field, anchors }`, with the field definition and the scale anchors.
- New `f.loading` is `true` while the options provider of the field runs. `f.disabled` keeps its meaning.
- New `f.freeText` gives `text` and `setText(text)` for an input that takes typed text, with the same rules as `mapControls` `freeText`.
- New `useFieldProps(props)` hook in React keeps the typed text of `f.freeText` between renders.
- New `freeText()` helper and `FreeText` type in `@formhaus/core/fields`, and `ControlContext` type in the `/controls` entries.
