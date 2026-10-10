---
"@formhaus/vue": minor
---

- `submitHandler` receives the ids of skipped steps as a second argument.
- New `FormhausForm` in `@formhaus/vue/cloud`. It loads a published definition by `id`, renders it and posts submissions, with a `success` event, an `onError` prop and `fallback` and `success` slots. 422 responses map onto fields.
