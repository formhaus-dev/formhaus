---
"@formhaus/react": minor
---

- New `fieldProps(props)` returns the ids, ARIA attributes, flags, value and handlers of a custom field: `attrs` for a native control, `input` for a component library control, `option(option, index)` for radios and checkboxes, `inputType`, `onInput` and `commit` for `autoAdvance` picks.
- `errorSummary` takes `"top"` to render the error summary first in the form, before the progress and the fields. `"bottom"` and `true` keep it above the buttons.
- New `className` prop adds classes to the `<form>` element.
- `layout.section` gets `columns` in a matrix section. `components.section` gets the same props as before.
- `layout.actions` gets `primaryDisabled` while the `disabled` conditions of the primary action match.
- `layout.progress` gets `stepErrorsLabel`, and each step in `steps` gets `errorsLabel`, from the `stepErrors` label. A `progressComponent` with `stepErrorMarks` gets `errorsLabel` in its `steps` too.
