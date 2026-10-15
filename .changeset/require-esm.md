---
'@formhaus/core': patch
'@formhaus/react': patch
'@formhaus/vue': patch
---

- CommonJS code can `require()` the packages on Node 20.19+ and 22.12+. Before, `require()` failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
