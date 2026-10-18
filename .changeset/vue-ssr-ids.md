---
"@formhaus/vue": patch
---

- Fixed hydration mismatches of field ids and label `for` attributes on Vue 3.3 and 3.4 when a form was rendered on the server.
- Field ids of server-rendered forms on Vue 3.3 and 3.4 start with `app.config.idPrefix` when it is set.
