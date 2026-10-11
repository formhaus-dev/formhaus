---
"@formhaus/react": minor
---

- **Breaking:** `helperText` renders under the label, above the control. For checkbox and switch it renders under the row. Errors stay below the control.
- Helper text stays visible while the field shows an error. `aria-describedby` lists both.
- `layout: "inline"` adds the `fh-field__radio-group--inline` or `fh-field__multiselect-group--inline` class.
