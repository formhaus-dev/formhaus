---
'@formhaus/react': patch
'@formhaus/vue': patch
---

Fixed TS4023 "cannot be named" in packages that emit declarations and use `controlShellProps` from `@formhaus/vue/controls`, or props of `FormhausForm` from `@formhaus/react/cloud` and `@formhaus/vue/cloud`.
