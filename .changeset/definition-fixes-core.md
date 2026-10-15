---
'@formhaus/core': minor
---

- New `@formhaus/core/fix` entry with `suggestFixes()`, `applyFix()` and `fixAll()`. The main entry does not include it.
- `suggestFixes()` attaches `fixes` to definition issues it can repair. Each fix is `{ title, safe, patch }` with an RFC 6902 JSON Patch.
- `applyFix()` returns a new definition and throws on a patch path that does not exist.
- `fixAll()` applies every safe fix and returns the definition, the applied fixes and the issues left.
- `checkDefinition()` and `FormEngine` reject a field whose options repeat a value, with the new `duplicate-option-value` error.
