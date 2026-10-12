---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormhausForm` shows the form's success message, opens its redirect URL after a submission and offers "Submit another response" when the form allows it.
- `FormhausForm` sends the render token and a honeypot field with each submission.
- New `initialForm` prop on `FormhausForm` renders a form loaded on the server with `fetchForm()` from `@formhaus/core/cloud`, without a request in the browser.
- New `draftStore` prop on `FormhausForm` keeps unsent answers. `sessionDraftStore()` from `@formhaus/core/cloud` stores them in `sessionStorage` for 7 days without `password` and `file` fields.
- New `fetchForm()` in `@formhaus/core/cloud` returns `{ definition, version, settings, renderToken }`.
- `createSubmitter()` takes `renderToken` and an `extraBody()` callback.
- A `426 client_outdated` answer fails with code `"client_outdated"` and "This form needs a newer version of this page."
- **Breaking:** `@formhaus/core/cloud` loads forms from `GET /f/{id}/form?core=<version>` instead of `GET /f/{id}/definition`, and posts to `/f/{id}?core=<version>`. Allow the new path and query if a proxy or content security policy filters requests to `api.formhaus.dev`.
