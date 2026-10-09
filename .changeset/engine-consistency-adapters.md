---
"@formhaus/react": patch
"@formhaus/vue": patch
---

- An `errors` prop with unchanged contents no longer clears validation errors on re-render.
- An `errors` prop is re-applied when it repeats an error the user has since cleared.
