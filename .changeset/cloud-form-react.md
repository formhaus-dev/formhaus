---
"@formhaus/react": minor
---

- `onSubmit` receives the ids of skipped steps as a second argument.
- New `FormhausForm` in `@formhaus/react/cloud`. It loads a published definition by `id`, renders it and posts submissions, with `onSuccess`, `onError`, `fallback` and `success` props. 422 responses map onto fields.
