---
'@formhaus/core': patch
'@formhaus/react': patch
'@formhaus/vue': patch
---

The main entries of `@formhaus/react` and `@formhaus/vue` no longer load Cloud code when unbundled.
Sourcemaps no longer embed source contents. `@formhaus/core` unpacked size is down from 1.83 MB to 1.24 MB.
