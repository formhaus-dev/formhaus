---
"@formhaus/vue": minor
---

- New `@formhaus/vue/controls` entry with `mapControls({ shell, labels, kinds, matrix, controls })` and `controlShellProps`. It returns a `components` map from one control per field type and one shell for the label, helper and error. Controls get the id, ARIA, `modelValue` and an `onUpdate:modelValue` that takes a value, an event, an option object or a `Date`. An adapter `children` becomes the default slot.
- Mapped radio, scale and rating fields commit `autoAdvance` on a click, Enter or Space. Arrow keys only change the value.
- Development builds warn with `double-label` when a mapped control has two `<label for>` elements.
