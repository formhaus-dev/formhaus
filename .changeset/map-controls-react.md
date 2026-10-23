---
"@formhaus/react": minor
---

- New `@formhaus/react/controls` entry with `mapControls({ shell, labels, kinds, matrix, controls })`. It returns a `components` map from one control per field type and one shell for the label, helper and error. Controls get the id, ARIA, the value and an `onChange` that takes an event, a value, an option object or a `Date`.
- Mapped radio, scale and rating fields commit `autoAdvance` on a click, Enter or Space. Arrow keys only change the value.
- Development builds warn with `double-label` when a mapped control has two `<label for>` elements.
