---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

Source maps are now published alongside the minified bundles. When a form throws in a consumer's app, the stack trace points at the original source line in `src/`, not at a one-letter variable in the minified output.
