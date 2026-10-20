---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- **Breaking:** `errorSummary` is on by default. Pass `errorSummary={false}` in React or `:error-summary="false"` in Vue to hide the summary.
- **Breaking:** `draftStore` defaults to a `sessionStorage` draft in `FormhausForm`. The draft never holds `password`, `file` or `hidden` values and is deleted after a successful submission. Pass `draftStore={false}` to turn it off.
- New `draftExclude` prop on `FormhausForm` lists field keys to leave out of the draft.
