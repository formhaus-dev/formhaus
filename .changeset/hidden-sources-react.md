---
'@formhaus/react': minor
---

- `FormRenderer` fills `hidden` fields from their `source` after mount. Initial values win, `defaultValue` is the fallback, and `onFieldChange` is not called.
