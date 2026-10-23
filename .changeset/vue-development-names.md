---
"@formhaus/vue": patch
---

- Components carry their names only in development builds. `FormRenderer` with core is 0.14 KB smaller gzipped. In production, `KeepAlive` `include` and `exclude` no longer match Formhaus components by name.
