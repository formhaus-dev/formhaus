---
"@formhaus/core": patch
---

- `replaceDefinition()` no longer lets a second submit start while the first is in flight.
- `validateSubmission()` treats a `multiselect` value that is not a list or has more items than allowed as unanswered when it evaluates conditions. Large submitted arrays no longer slow down condition checks.
