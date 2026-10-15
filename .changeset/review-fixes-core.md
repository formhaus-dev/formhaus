---
'@formhaus/core': patch
---

- Fixed a cancelled final Skip restoring old answers and server errors over a newer submission when its response arrived late.
- Fixed `stepErrors` for steps with ids such as `constructor` and `__proto__`. `stepErrors` is now an object without a prototype.
- `validateSubmission()` treats an empty array in a built-in field other than `multiselect` as a missing answer, as the browser does. It is left out of the returned values, an optional field passes, and a required field fails with the required message instead of a type error.
