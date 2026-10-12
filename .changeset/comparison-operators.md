---
"@formhaus/core": minor
---

- New condition operators `gt`, `gte`, `lt` and `lte` compare a number, or a numeric string such as a radio option value, with a number operand. Any other value does not match.
- `checkDefinition()` reports a non-number operand as an error, and a comparison on a `checkbox`, `switch` or `multiselect` field as a warning.
