---
'@formhaus/core': patch
'@formhaus/react': patch
'@formhaus/vue': patch
---

- Fixed fields in one group item getting the same DOM id when their keys differ only in punctuation, such as `contact.email` and `contact-email`. The second error summary link focused the first field.
- Fixed a section and a field getting the same DOM id when their keys differ only in punctuation.
