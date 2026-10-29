---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

New `validateWithRules` option and renderer prop runs `onValidate` even when the definition rules fail. Both errors show in one round; the definition error wins on the same field.
