---
"@formhaus/core": minor
---

- A field that becomes hidden loses its validation error even when it has no value.
- A skip that changes the active path removes the errors of fields that leave it.
- **Breaking:** `engine.skip()` returns `false` on a step without a `skip` action instead of skipping it. Add `skip: { label }` to the step, or call `next()`.
