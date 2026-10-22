---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": patch
---

- New `hiddenValues` engine option, `'clear'` (default) or `'keep'`. With `'keep'`, fields hidden by conditions keep their values in `engine.values` and in submitted values.
- With `'keep'`, conditions, validation and recall still treat hidden fields as unanswered, and hidden fields never block Continue or Submit.
- With `'keep'`, submitted values also hold the answers on steps off the active path. Fields of skipped steps stay out.
- `validateSubmission()` takes the same `hiddenValues` option. With `'keep'`, it returns hidden values without validating them and drops one that fails its type check without an error.
- New `hiddenValues` prop on `FormRenderer` and `HeadlessFormRenderer`, and option of `useFormEngine`.
- `capabilities` in `@formhaus/mcp` describes `hiddenValues`.
