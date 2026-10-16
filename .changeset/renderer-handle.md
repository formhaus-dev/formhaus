---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormRenderer` and `HeadlessFormRenderer` take a ref that exposes `setValue(key, value)` and `getValues()`. The type is `FormRendererHandle`.
- `setValue` from the ref does not call `onFieldChange` in React or emit `fieldChange` in Vue.
