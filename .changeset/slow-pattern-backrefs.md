---
"@formhaus/core": patch
---

- `validateSubmission()` also refuses, and `checkDefinition()` reports as `slow-pattern`, a pattern that repeats a backreference next to overlapping parts or inside a repeated group, such as `(-)(?:a*\1*-)+$` or `(?<s>-)(?:a*\k<s>*-)+$`.
