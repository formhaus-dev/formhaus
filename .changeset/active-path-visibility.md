---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- Two fields may share a key on route branches that never meet on one path. The field on the active path owns the value and its rules.
- **Breaking:** `show`, `showAny`, route and `disabled` conditions see only the active projection, with or without routes: visible values of earlier steps on the path plus the condition's own step. A field condition on a field of a later step makes the constructor throw. Move the referenced field to the same or an earlier step.
- **Breaking:** a step `show` or `showAny` on a field of the same or a later step makes the constructor throw in forms without routes too. Move the referenced field to an earlier step.
- **Breaking:** a condition or `matchField` on a key that is not a field key makes the constructor throw instead of logging a warning. Initial values for such keys no longer affect conditions. Add a field with that key on an earlier step.
- **Breaking:** without routes, `setValue()` on a hidden field clears the value at once instead of keeping it until a referenced field changes. Read the value only while the field is visible.
- **Breaking:** validators, `onStepValidate` and lifecycle hooks receive the active projection in forms without routes too, without hidden fields and keys that are not field keys. Read other context from your own state.
- **Breaking:** a field `key` used twice on one possible path makes the constructor throw instead of logging a warning. Rename one of the fields.
- **Breaking:** React and Vue evaluate `submit.disabled` against `getSubmitValues()` instead of `engine.values`, and pass the same values as `values` to a custom actions component. Values of fields off the active path or on skipped steps no longer disable Submit.
