---
"@formhaus/core": patch
---

`trackDirty` counts `NaN` as equal to `NaN`, so a field holding `NaN` is clean after `markClean()`.
