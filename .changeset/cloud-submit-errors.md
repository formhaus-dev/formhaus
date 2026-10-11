---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- **Breaking:** `onError` in `FormhausForm` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
- `FormhausForm` shows every failed submission in a notice above the form, with "Try again" for 429, 5xx and network failures. The notice takes focus. Entered values stay.
- `FormhausForm` focuses the first field with a server error when there is no notice. Messages for keys the form does not render are listed in the notice.
- `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, marks dropped answers with "Please answer again." and asks to review and submit again.
- `FormhausForm` now renders the form inside a `div.fh-cloud` wrapper.
- `CloudError.message` texts changed. `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`.
- `createSubmitter()` takes an optional `version` next to `id` and `apiBase`.
- New `.fh-form__notice` styles in `@formhaus/core/style.css`.
