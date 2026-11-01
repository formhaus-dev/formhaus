---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.8: options take `description` and `disabled`, fields take `readOnly`, groups take `reorderable`. `disabled` and `readOnly` are `true` or a list of conditions that must all match.
- These properties take effect only with `"formatVersion": "1.8"` or newer. Below it they are ignored, as before.
- A value that holds a disabled option fails with the `option` message, unless the stored answer already holds it. In the engine the stored answer is the start value of the field.
- New `previousValues` option of `validateSubmission()`, `validateFieldValue()` and `validateFields()` for the stored answers.
- A read-only field runs only its type check. Its value is submitted.
- New `engine.moveItem(key, from, to)` moves a group item with its values, id, errors and loading state.
- Option descriptions are translatable under `fields.<key>.optionDescriptions.<value>`.
- New `moveUp`, `moveDown` and `itemMoved` labels in every bundled locale.
- The built-in React and Vue fields show option descriptions under the label, linked with `aria-describedby`, and draw disabled options with `disabled`.
- Read-only fields stay focusable: `readonly` on inputs, `aria-readonly` on other controls. New `readOnly` prop on `FormRenderer` and `HeadlessFormRenderer` makes every field read-only and hides the group Add, Remove and Move buttons.
- `FieldComponentProps` gets `readOnly`. Group item views get `move(to)` and `count` for a reorderable group.
- New `@formhaus/react/reorder` and `@formhaus/vue/reorder` entries export `ReorderGroupItem`, a group item with Move up and Move down buttons. Without it, a reorderable group shows no Move buttons and logs a `missing-component` warning in development.
- New `OptionView` type: an option as renderers receive it, with `disabled` resolved to a boolean. `ControlOption` and the `options` of field views use it.
- New `optionAttrs`, `optionDescriptionId`, `readOnlyAttrs` and `optionLocked` in `@formhaus/core/fields`.
- `checkDefinition()` reports `invalid-type` for these properties from format 1.8, `disabled-not-applicable` for `disabled` on an option of another field type, and `outdated-format-version` below format 1.8.
- `capabilities` in `@formhaus/mcp` describes option `description`, `disabled`, `readOnly` and `reorderable`.
