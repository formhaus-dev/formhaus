---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormhausForm` shows every failed submission in a notice above the form, an `aria-live` region with a short message and "Try again" for 429, 5xx and network failures. Entered values stay.
- `FormhausForm` focuses the first field with a server error. Errors for keys the form does not render are listed in the notice.
- `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, and asks to review and submit again.
- `onError` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
- `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`. Its messages are shorter and name the problem.
- `createSubmitter()` takes the rendered version as a third argument.
- New `fetchPublished()`, `carryValues()`, `splitErrors()`, `failureFor()` and `focusFirstInvalid()` in `@formhaus/core/cloud`.
- New `.fh-form__notice` styles in `@formhaus/core/style.css`.
