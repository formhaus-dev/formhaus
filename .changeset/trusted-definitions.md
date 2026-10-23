---
"@formhaus/core": minor
---

- New `process.env.FORMHAUS_TRUSTED` define. Set to `"1"`, it drops the production structure check from the bundle: `FormEngine` goes from 18.8 KB to 14.0 KB gzipped, `FormRenderer` with core about 4.5 KB less. An invalid definition then fails with a plain runtime error instead of `FormDefinitionError`. Development builds still run `checkDefinition()`.
- In production, `FormEngine` and `replaceDefinition()` skip the structure check for a definition returned by `parseDefinition()`.
