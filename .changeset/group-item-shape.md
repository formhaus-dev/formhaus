---
'@formhaus/core': patch
---

- Fixed group items that are not plain objects, such as `null` or a string in the initial values, passing client validation and reaching `onSubmit` as `{}`.
- A group with such items fails with `Invalid value` in the browser, as in `validateSubmission()`.
