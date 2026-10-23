---
"@formhaus/core": minor
---

- New `errorSummary(engine, { idPrefix?, labels? })` returns the engine's field errors grouped by step, its top-level errors and the field error count.
- New types `ErrorSummary` and `ErrorSummaryOptions`.
- `FormRendererHandle` declares `showField(key)` and `getErrors()`.
