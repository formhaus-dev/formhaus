---
'@formhaus/core': minor
---

- New `onFormEvent` option reports form lifecycle events from `FormEngine`.
- New `start()` method reports `form_viewed` and the first `step_viewed` once per engine.
- `step_viewed` fires after `start()` on every change of the current step, including `goToStepWithField` and `reset()`.
- New `field_shown` and `field_hidden` events fire when a field's condition result changes. Group item fields report their path.
- New `form_submit_succeeded`, `form_submit_failed` and `form_reset` events. `form_submit_failed` has `reason: 'rejected' | 'error'`.
- An error thrown by `onFormEvent` is rethrown in a microtask and does not interrupt the action.
- New `FormEvent` type. `FormAnalyticsEvent` is an alias of it.
