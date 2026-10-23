---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- The `FormRenderer` and `HeadlessFormRenderer` handle has `showField(key)`, which opens the step of a field and focuses it. It does nothing while a step check or a submit is pending.
- The handle has `getErrors()`, which returns the errors on screen: the error summary groups, and the top-level errors with the message of a failed `onSubmit`.
