---
"@formhaus/core": minor
---

- **Breaking:** The `FormEngine` constructor throws on duplicate step ids in forms without routes.
- **Breaking:** `notEmpty` treats an empty array as empty, the same as `required`.
- `validateField()` returns `null` when a validator returns `''`.
- **Breaking:** In forms without routes, fields of a skipped step have no value for `matchField`, validators and step hooks, as in forms with routes.
- `validateDefinition()` reports duplicate step ids in forms without routes.
- `validateDefinition()` warns when a step condition in a routed form references a field of the same or a later step.
- `validateDefinition()` says that `FormEngine` rejects a definition with both `fields` and `steps`, instead of saying `fields` is ignored.
- The constructor error for a definition with both `fields` and `steps` now matches that warning text.
- The `FormEngine` constructor warns about a `validator` name missing from the `validators` option.
