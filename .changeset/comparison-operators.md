---
"@formhaus/core": minor
---

- New condition operators `gt`, `gte`, `lt` and `lte` compare a number, or a numeric string such as a radio option value, with a number operand. Any other value does not match.
- `checkDefinition()` warns about a comparison with a non-number operand, or on a `checkbox`, `switch` or `multiselect` field.
