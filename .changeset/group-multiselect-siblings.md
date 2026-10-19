---
"@formhaus/core": minor
---

- `validateSubmission()` no longer drops a field in a group item and reports it as required when an invalid answer in the same item controls its visibility.
- **Breaking:** `validateSubmission()` no longer returns a value that fails its type check in `values`, at top level and in group items.
- `validateSubmission()` treats a value that fails its type check as unanswered in conditions, at top level and in group items.
- Custom validators no longer receive values that fail their type check in `validateSubmission()`.
