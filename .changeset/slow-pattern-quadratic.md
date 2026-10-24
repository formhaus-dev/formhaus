---
"@formhaus/core": patch
---

- `validateSubmission()` runs a `slow-pattern` pattern again when it starts with `^`, has no `|` outside a group, and has no more than two overlapping repeats in a row, such as `^\d+\.?\d*$` or `^[0-9]+\s?[0-9]+$`. In 1.4.0 it refused every submission to a form with such a pattern. `checkDefinition()` still warns about these patterns.
