---
"@formhaus/core": patch
---

- `validateSubmission()` throws a `FormDefinitionError` with a `slow-pattern` error for a `pattern` that `checkDefinition()` reports as `slow-pattern` or that is longer than 1000 characters, instead of running it on the submitted values. Such a pattern could block the server for minutes on a value of 40 characters. A definition that `validateSubmission()` accepted before can now throw. The engine still runs these patterns and only warns.
- `checkDefinition()` reports `slow-pattern` for a pattern longer than 1000 characters and for repeated groups next to overlapping repeated parts, such as `(ab)+(ab)+`.
- `slow-pattern` no longer reports a repeated group that starts or ends with a character nothing else in the group matches, such as `([\w-]+\.)+` or `(,\s*[a-z]+)*`.
