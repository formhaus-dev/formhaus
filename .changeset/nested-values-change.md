---
'@formhaus/react': patch
'@formhaus/vue': patch
---

Fixed a value set inside the first `onValuesChange` (React) or `valuesChange` (Vue) call not firing another change.
