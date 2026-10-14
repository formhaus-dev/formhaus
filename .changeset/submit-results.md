---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- The submit handler can return `{ ok: true }` or `{ ok: false, errors, formErrors }`. A rejection keeps the answers, shows the errors and does not run `onAfterSubmit`. Handlers that return nothing work as before.
- New `SubmitResult` and `SubmitHandler` types.
- Server errors from a rejection or `setErrors()` stay through step navigation and validation of other fields. Editing a field removes only that field's error.
- `setErrors()` and a rejection open the earliest step with an error, whatever the key order.
- A successful submission clears server errors and form-level errors.
- `onStepValidate` errors no longer remove server errors on other steps.
- A submit response that arrives after `reset()`, `cancelPendingActions()` or an unmount is ignored. Errors for fields edited during the request are dropped.
- New `engine.stepErrors` lists the fields with errors by step.
- New `errorSummary` renderer prop lists every field error with a link that opens its step and focuses the field.
- New `stepErrorMarks` renderer prop lists the steps under the progress bar and marks the steps with errors. Custom progress components receive the list as `steps`.
- The form-level error banner has `role="alert"`.
