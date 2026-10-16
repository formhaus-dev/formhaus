---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormhausForm` runs the Formhaus Cloud bot check when Cloud has it on. The check stays hidden unless it needs a click, then shows above the submit button. Allow `frame-src https://formhaus.cc` in a Content-Security-Policy to enable it. Without it, the form submits without a token and the form's bot check setting decides.
- A failed bot check shows a notice. Submitting again runs the check again.
- Notices, load errors and the success message use the theme tokens and dark theme.
- Peer dependency on `@formhaus/core` is now `^0.17.0`.
