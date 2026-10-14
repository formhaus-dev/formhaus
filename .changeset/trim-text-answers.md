---
'@formhaus/core': patch
---

- Text answers are trimmed of leading and trailing spaces before validation and submit. A `required` field with only spaces is empty. Passwords are not trimmed.
