---
"@formhaus/core": patch
---

- `validateSubmission()` runs a `slow-pattern` pattern again when it starts with `^` and has exactly one pair of overlapping repeats, such as `^\d+\.?\d*$` or `^[0-9]+\s?[0-9]+$`. A pattern with `|`, a lookaround, a backreference, an optional group or a `{0,n}` quantifier is still refused. In 1.4.0 every submission to a form with such a pattern was refused. `checkDefinition()` still warns about these patterns.
- On the server, a value longer than 1000 characters fails such a pattern with the field's `pattern` error without being matched.
