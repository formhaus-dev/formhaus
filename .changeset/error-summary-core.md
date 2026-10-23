---
"@formhaus/core": minor
---

- New `errorSummary(engine, { idPrefix?, labels? })` returns the field errors grouped by step, the top-level errors and the field error count.
- New types `ErrorSummary` and `ErrorSummaryOptions`.
- `FormRendererHandle` declares `showField(key)` and `getErrors()`.
