---
"@formhaus/react": patch
"@formhaus/vue": patch
---

- Focus after a failed submit and after adding a group item reaches custom controls with a `tabindex`. Controls with `tabindex="-1"` or `aria-disabled="true"` are skipped.
- A custom field with `optionsFrom` gets `loading` while its options provider runs.
- A built-in field with `optionsFrom` gets `aria-busy="true"` while its options provider runs.
- Requires `@formhaus/core` 1.2.3.
