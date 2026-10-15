---
'@formhaus/core': patch
---

- Fixed group items that are not plain objects, such as `null` or a string in the initial values, passing client validation and reaching `onSubmit` as `{}`. The group now fails with `Invalid value`, like in `validateSubmission()`.
