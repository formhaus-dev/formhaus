---
"@formhaus/core": patch
---

- Field keys `__proto__`, `constructor`, `prototype` and the other `Object.prototype` property names are rejected by `FormEngine`, `validateDefinition`, `checkDefinition` and the JSON Schema. They bypassed `required`.
