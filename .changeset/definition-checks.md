---
"@formhaus/core": patch
---

- `validateDefinition()` and `checkDefinition()` from `@formhaus/core/server` return messages for malformed input instead of throwing. This covers `null`, `fields` or `steps` that is not an array, a step without `fields`, and `show`, `showAny` or `routes` that is not an array.
- The `FormEngine` constructor throws an `Error` that names the malformed part instead of a `TypeError`.
- `validateDefinition()` reports a missing `submit` action and a condition without `field`.
- `FormDefinition` accepts `$schema`.
- `validateSubmission()` no longer logs definition warnings with `console.warn`.
