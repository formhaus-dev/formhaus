---
"@formhaus/vue": patch
---

Fixed the select field showing the first option instead of the current value or the placeholder in server-rendered HTML. On Vue 3.3 the wrong option also stayed after hydration.
