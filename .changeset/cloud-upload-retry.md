---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- `FormhausForm` uploads a file again and resubmits once, without user action, when Formhaus Cloud answers "Upload the file again." for an expired upload.
- The resubmit asks for a new bot check token and does not show the first attempt's error.
