---
'@formhaus/core': minor
---

- Definition format 1.1 adds `section` nodes: a titled block of fields with shared `show`/`showAny`. Fields inside keep their top-level keys in the payload.
- Definition format 1.1 adds `group` nodes: repeatable items submitted as an array of objects, with `required`, `minLength` and `maxLength` counting items.
- New `FormEngine` methods `items()`, `addItem()`, `removeItem()` and `setItemValue()`, and the `visibleNodes` getter.
- `setValue()`, `validateField()`, `setErrors()` and submit results accept item paths such as `participants.1.email`.
- `validateSubmission()` checks every group item, drops unknown item keys and reports item errors by path.
- `checkDefinition()` reports `group-scope` and `invalid-nesting`, and warns with `outdated-format-version` about sections or groups without `formatVersion` 1.1.
- New label keys `addItem`, `removeItem`, `itemLabel`, `itemAdded`, `itemRemoved`, `removeItemPrompt` and `keepItem`, and translation addresses for sections, groups and item fields.
- New `isSection()` and `isGroup()` helpers and `FormSection`, `FormGroup`, `FormNode`, `GroupValidation`, `GroupI18n` and `GroupItem` types.
- **Breaking:** `FormStep.fields` and `FormDefinition.fields` are typed `FormNode[]`. Code that walks them must handle sections and groups.
- **Breaking:** Errors of item fields use paths such as `participants.1.email` as keys in `errors` and `stepErrors`.
- **Breaking:** custom field types named `section` or `group` are now built-in nodes.
- Upgrade the server that runs `validateSubmission()` before the clients. Older servers pass group values through unchecked.
- `style.css`: placeholders and checkbox and radio borders meet WCAG AA contrast, the step title and section headings use the new `--fh-font-size-title` and `--fh-font-size-heading` tokens, and group cards use `--fh-card-padding`.
- `style.css`: helper text sits 4px under its label, and checkbox and switch helpers and errors line up with the label text.
- `style.css` takes every margin, padding and gap from the new `--fh-space-1` to `--fh-space-10` variables.
