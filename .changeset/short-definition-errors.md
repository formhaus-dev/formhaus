---
"@formhaus/core": minor
---

- In production builds, and in a browser without a bundler where `process` is not defined, `FormDefinitionError` from `FormEngine` and `replaceDefinition()` lists `path: code` for each issue, without `hint`. `checkDefinition()`, `parseDefinition()` and development builds keep the full text. `FormEngine` with core is about 1 KB smaller gzipped.
