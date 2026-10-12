---
"@formhaus/core": patch
---

- `FormEngine` is 8.9 KB gzipped in production builds, down from 10.6 KB.
- In production builds, and in a browser without a bundler where `process` is not defined, the `FormEngine` constructor runs only the error checks. It no longer passes warnings to `onWarning`, and its errors have no typo suggestions. Call `checkDefinition()` to get warnings in production.
