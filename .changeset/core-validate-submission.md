---
"@formhaus/core": minor
---

- New `@formhaus/core/server` entry with `validateSubmission(definition, values, { skippedSteps })`. It returns the submit values and errors for a submitted payload.
- `validateSubmission()` drops unknown keys and values of hidden steps, hidden fields and skipped steps. It accepts a skip only for steps with `skip`.
- `validateSubmission()` checks value types: text fields and `file` take strings, `number` takes numbers or decimal strings, `checkbox` and `switch` take booleans, choices must come from `options`.
- `validateSubmission()` checks `email`, `date` (`YYYY-MM-DD`) and `datetime` (ISO 8601) formats.
- `validateSubmission()` accepts only strings, numbers and booleans in custom field types.
- `validateSubmission()` rejects strings over 10,000 characters or the field's `maxLength` before any rule runs. Custom `validators` are ignored.
- New `@formhaus/core/server.iife.js` build exposes `validateSubmission` on a `Formhaus` global.
- Shared submission fixtures ship in `@formhaus/core/fixtures/submissions/*.json`. Each file holds one definition and its cases.
