---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `conditionalReveal` prop draws a field shown by a `radio` or `multiselect` option under that option, indented, with `aria-controls` on the option input and `aria-expanded` on a checkbox option. It is off by default.
- With `conditionalReveal`, the error of a choice field with revealed fields shows above its options.
- New `conditionalReveal` option in `mapControls` lists the types whose `props` draw `option.reveal`. Other custom field components keep the fields after the group.
- Built-in and mapped field components get `reveals`.
- `ControlOption` from `/controls` types `reveal` with React nodes or Vue nodes.
