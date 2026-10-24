---
"@formhaus/core": minor
---

- New `emptyStrings` option for `schemaValidate()`. `'omit'` drops empty strings from the values the schema sees, at the top level and in group items, so a cleared field passes `.optional()` like an untouched one. The default `'keep'` passes them as before.
- Exposes the `SchemaValidateOptions` type.
