---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- Built-in inputs have `name` set to the field key.
- Custom field components receive an `id` prop. Put it on the control so the label and error messages stay linked.
- **Breaking:** field ids are unique per form instance: `<form id>-<key>`, with characters other than letters, digits, `_` and `-` in the key replaced by `-`. React used `id="email"` and Vue `id="fh-field-email"`. Select inputs by `name` or by label instead of `#email`.
- **Breaking:** radio and multiselect option ids end in the option index instead of the option value. Select options by label.
- **Breaking:** helper and error ids follow the field id: `<field id>-helper` and `<field id>-error`.
