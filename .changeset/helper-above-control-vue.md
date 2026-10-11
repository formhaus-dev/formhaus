---
"@formhaus/vue": minor
---

- **Breaking:** `helperText` renders under the label, above the control. For checkbox and switch it renders under the row. Errors stay below the control.
- Helper text stays visible while the field shows an error. The error has its own id, `fh-field-<key>-error`, and `aria-describedby` lists both.
- Field errors have `role="alert"`, as in React.
- `layout: "inline"` adds the `fh-field__radio-group--inline` or `fh-field__multiselect-group--inline` class.
- Select and textarea get the `fh-field__input--select` and `fh-field__input--textarea` classes, as in React.
