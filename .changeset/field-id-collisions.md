---
'@formhaus/react': patch
'@formhaus/vue': patch
---

- Fixed two fields sharing one element id when their keys differ only in characters other than letters, digits, `_` and `-`, such as `contact.email` and `contact-email`. Labels, error messages and error summary links pointed at the first field. Ids of keys without such a collision are unchanged.
