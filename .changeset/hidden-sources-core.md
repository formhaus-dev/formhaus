---
'@formhaus/core': minor
---

- New `source` on `hidden` fields: a URL parameter (`{ "query": "utm_source" }`), `referrer`, `page`, `pageTitle`, `language`, `timezone`, `device` or `country`.
- New `resolveSources(definition, context)` returns the values of sourced hidden fields for a page context.
- `checkDefinition()` reports an unknown source as `unknown-source`, a malformed one as `invalid-type`, and a `source` on another field type as the `source-not-applicable` warning.
- `hidden` values without `maxLength` are capped at 2000 characters in the browser and in `validateSubmission()`.
