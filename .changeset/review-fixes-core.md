---
'@formhaus/core': patch
---

- Fixed a cancelled final Skip restoring old answers and server errors over a newer submission when its response arrived late.
- Fixed `stepErrors` for steps with ids such as `constructor` and `__proto__`. `stepErrors` is now an object without a prototype.
- `validateSubmission()` treats an empty array in a built-in field other than `multiselect` as a missing answer and leaves it out of the returned values.
- An optional field with an empty array passes `validateSubmission()`.
- A required field with an empty array fails `validateSubmission()` with the required message instead of a type error.
