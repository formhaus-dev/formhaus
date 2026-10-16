---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormhausForm` runs the Formhaus Cloud bot check when the form requires it. The check stays hidden unless it needs a click, then shows above the submit button. Sites with a Content-Security-Policy must allow `frame-src https://formhaus.cc`.
- A failed bot check shows a notice with a retry that runs the check again.
- Peer dependency on `@formhaus/core` is now `^0.17.0`.
