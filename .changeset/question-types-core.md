---
"@formhaus/core": minor
---

- New `scale` field type: one integer point from `validation.min` to `validation.max`, 1 to 5 by default. `0` on a 0-based scale counts as an answer.
- New `rating` field type: 1 to `validation.max` stars, 5 by default. `validation.min` is an ordinary "at least" rule.
- `scale` and `rating` reject values that are not whole numbers in range with the `option` message.
- `validateSubmission()` converts decimal strings such as `"7"` to numbers for `scale` and `rating`, as it does for `number`.
- `options` on `scale` and `rating` are anchor labels, not choices. Conditions on these fields compare numbers.
- New `image` on options of `radio` and `multiselect` fields.
- New `layout: "matrix"` on sections.
- A step or section may have an empty `fields` array, for a welcome screen or a statement.
- Format version 1.3. `checkDefinition()` warns with `outdated-format-version` about `scale` or `rating` without `"formatVersion": "1.3"`.
- **Breaking:** `rating` and `scale` are built-in type names now. A custom field type named `rating` or `scale` gets the built-in checks and renderer. Rename it with a dash, such as `x-rating`.
- `unknown-field-type` no longer suggests a built-in type for a custom type with `-` or `:`, such as `x-rating`.
- `style.css` styles scale, rating, picture options, matrix sections and steps without fields.
