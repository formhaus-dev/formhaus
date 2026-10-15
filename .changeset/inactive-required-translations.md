---
'@formhaus/core': patch
---

- Fixed `translationTemplate()` and `textSlots()` listing a `validation.required: ""` rule as translatable. A translation for it made the field required. `translationIssues()` now reports it as unknown.
