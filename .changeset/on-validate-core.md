---
"@formhaus/core": minor
---

- New `onValidate` engine option runs after the definition rules pass, on Continue after `onStepValidate` and on Submit before `onBeforeSubmit`. It gets the values and `{ stepId, fields, submit }`, where `fields` lists the visible field paths in scope, and returns errors keyed by field path. Keys outside `fields` show as top-level errors.
- An `onValidate` error on another step opens that step on Submit.
- New types `ValidateFn` and `ValidateContext`.
- New `@formhaus/core/schema` entry with `schemaValidate(schema)`, which turns a Standard Schema such as Zod, Valibot or ArkType into an `onValidate` function, and the `StandardSchemaV1` type.
