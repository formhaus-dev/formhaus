---
'@formhaus/core': patch
---

- Fixed a cancelled final Skip restoring old answers and server errors over a newer submission when its response arrived late.
- Fixed `stepErrors` for steps with ids such as `constructor` and `__proto__`. `stepErrors` is now an object without a prototype.
- `validateSubmission()` treats an empty array as an empty answer in every field type, as the browser does. An optional text, number, choice or boolean field with `[]` passes, and a required one fails with the required message instead of a type error.
