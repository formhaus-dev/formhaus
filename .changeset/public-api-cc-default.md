---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- `FormhausForm` and `@formhaus/core/cloud` load and submit forms through api.formhaus.cc by default. Add it to your CSP `connect-src` if you use an allowlist; api.formhaus.dev keeps working.
- The `apiBase` option still overrides the default.
