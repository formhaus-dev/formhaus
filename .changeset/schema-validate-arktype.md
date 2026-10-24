---
"@formhaus/core": patch
---

- Fixed `schemaValidate()` freezing the page with ArkType when an issue has no path or names a field outside the current step. This hit every multi-step form, hidden fields and root `.narrow()` checks.
- `schemaValidate(schema)(values)` works without the second argument. Each issue maps to the top-level key of its path, so it runs on the server next to `validateSubmission()`.
