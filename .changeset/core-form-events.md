---
'@formhaus/core': minor
---

- New `onFormEvent` option reports form lifecycle events from `FormEngine`.
- New `start()` method reports `form_viewed` and the first `step_viewed` once.
- `step_viewed` fires after `start()` on every change of the current step, including `goToStepWithField` and `reset()`.
- New `form_submit_succeeded`, `form_submit_failed` and `form_reset` events. `form_submit_failed` has `reason: 'rejected' | 'error'`.
- New `FormEvent` type. `FormAnalyticsEvent` is an alias of it.
