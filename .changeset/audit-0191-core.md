---
"@formhaus/core": patch
---

- Cloud forms keep `scale` and `rating` answers when the form is updated during submit. An answer outside the new range is dropped.
- Submissions with duplicate options now fail validation. A `multiselect` value that repeats an option, including in a matrix row or a group item, gets the `options` message from `validateSubmission()` and the engine.
