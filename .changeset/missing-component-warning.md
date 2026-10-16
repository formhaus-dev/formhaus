---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- Warns in development once per field type that has no component in `components`. The warning lists the registered types and goes to `onWarning` with the code `missing-component`.
- The "Unsupported field type" placeholder names the type only in development.
- React: the placeholder has the `fh-field--unsupported` class, like in Vue.
