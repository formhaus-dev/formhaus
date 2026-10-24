---
"@formhaus/core": patch
---

- `validateSubmission()` runs a `slow-pattern` pattern again when it starts with `^`, is a flat list of characters, `\d`, `\w`, `\s` and character classes with `+`, `*` or `?`, and has exactly one pair of overlapping repeats, such as `^\d+\.?\d*$` or `^[0-9]+\s?[0-9]+$`. In 1.4.0 every submission to a form with such a pattern was refused. Every other `slow-pattern` pattern is still refused, and `checkDefinition()` still warns about all of them.
- On the server, a value longer than 1000 characters fails such a pattern with the field's `pattern` error without being matched.
