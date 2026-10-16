---
"@formhaus/core": minor
---

- **Breaking:** `validateSubmission()` no longer fills the `defaultValue` or `defaultItems` of a key missing from the payload.
- Fixed `validateSubmission()` skipping the rules of, or dropping, a field shown by the defaults of a skipped step.
