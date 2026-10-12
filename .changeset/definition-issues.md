---
"@formhaus/core": minor
---

- New `checkDefinition(definition)` in `@formhaus/core` returns `DefinitionIssue[]`: `{ code, severity, path, message, hint }`, with a JSON pointer `path` and errors first.
- New `parseDefinition(json)` returns the input typed as `FormDefinition`, or throws `FormDefinitionError`.
- New `onWarning(issue)` option in `FormEngineOptions` receives definition warnings. Without it, warnings go to `console.warn` outside production.
- New checks: missing `id`, `title` or `submit`; field types that look like typos of a built-in type; `select`, `radio` and `multiselect` without options; `defaultValue` outside `options`; `minLength` above `maxLength` and `min` above `max`; `min`/`max` or `minLength`/`maxLength` on a type they do not apply to; `matchField` and `optionsDependsOn` on unknown keys; conditions in `disabled`; condition values that can never match the field.
- A route condition on a misspelled key reports an unknown field.
- **Breaking:** `checkDefinition()` from `@formhaus/core/server` returns `DefinitionIssue[]` instead of `{ errors, warnings }`. Filter by `issue.severity === 'error'` for errors.
- **Breaking:** the `FormEngine` constructor throws `FormDefinitionError` with `issues` instead of a plain `Error`. Read `error.issues` instead of splitting `error.message` by lines.
- **Breaking:** a condition must have exactly one operator. `{ field }` without an operator and a condition with two operators make the constructor throw. Keep one of `eq`, `neq`, `in`, `notIn`, `notEmpty`.
- **Breaking:** an unknown condition key, such as `equals`, makes the constructor throw instead of always matching. Rename it to a known operator.
- **Breaking:** a condition without a known operator never matches at runtime instead of always matching.
- **Breaking:** an invalid `pattern`, a show-condition cycle, `minLength` above `maxLength`, `min` above `max`, a missing `submit` and a condition without `field` make the constructor throw instead of logging a warning. Fix the reported path.
- **Breaking:** a missing form `id`, step `id`, field `key` or field `type`, and a property of the wrong type, such as `in` that is not an array or `options` items that are not objects, make the constructor throw. Fix the reported path.
- **Breaking:** `validateSubmission()` throws `FormDefinitionError` when the definition has an error. Run `checkDefinition()` before you store a definition.
- **Breaking:** constructor warnings start with `[formhaus]` and a JSON pointer instead of `[FormEngine]`. Use `onWarning` to collect them.
- `validateDefinition()` is deprecated and returns the messages of `checkDefinition()`. Use `checkDefinition(definition).filter((issue) => issue.severity === 'error')`. It is removed in 1.0.
- The JSON Schema requires exactly one operator per condition.
