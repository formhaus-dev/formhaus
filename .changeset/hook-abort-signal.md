---
"@formhaus/core": minor
---

- `onStepValidate`, `onValidate`, `onBeforeStepChange` and `onBeforeSubmit` get an `AbortSignal` as their last argument. It aborts when the pending check goes stale: a checked value changes, the step changes, the form resets or unmounts, or `cancelPendingActions()` runs.
