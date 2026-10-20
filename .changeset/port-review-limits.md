---
"@formhaus/core": patch
---

- A group starts with at most `maxLength` items, or 100 without `maxLength`, whatever its `defaultItems`.
- `checkDefinition()` warns with `invalid-range` when `defaultItems` is greater than 100 on a group without `maxLength`.
- One validation tests at most 10,000 values against patterns. After that, `pattern` fails with its error.
- `validateSubmission()` and the engine stay linear on forms with thousands of steps or chained show conditions across steps.
