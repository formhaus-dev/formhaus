---
"@formhaus/core": minor
---

- New `checkDefinition(definition)` in `@formhaus/core/server` and on the `Formhaus` IIFE global. It returns `{ errors, warnings }`: errors are definitions `FormEngine` rejects, warnings are the rest of `validateDefinition()`.
