---
'@formhaus/mcp': patch
---

- `validate_definition` reports unknown properties as `unknown-property` errors with a suggested property name, and missing properties as `missing-property` errors on the object that lacks them, instead of the `schema` code.
