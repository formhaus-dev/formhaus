---
'@formhaus/core': patch
---

- `validateSubmission()` accepts answers when fields on route branches that never meet share a key with different types. Only the field on the active path is type-checked.
- `validateSubmission()` accepts any value for an `optionsFrom` field, as the browser does, also when the field has static `options`.
- `date` and `datetime` values must be real calendar dates. `2026-02-31` fails with "Enter a valid date".
- `checkDefinition()` and the `FormEngine` constructor report `invalid-type` when a field `label`, `placeholder` or `helperText`, an option `label`, a step `title` or `description`, or an action `label` is not a string.
- A `__proto__` key in initial values no longer changes the prototype of `engine.values`.
- New `isActionDisabled(action, values)` returns `true` when every `disabled` condition of the action matches.
