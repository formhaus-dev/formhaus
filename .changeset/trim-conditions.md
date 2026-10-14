---
'@formhaus/core': patch
'@formhaus/mcp': patch
---

- `show`, `showAny` and step `routes` conditions compare trimmed text answers. `" yes "` matches `eq: "yes"` and a text answer with only spaces fails `notEmpty`, the same as in `validateSubmission()`.
- `checkDefinition()` and the `FormEngine` constructor report `invalid-type` when a validation `*Message` is not a string or `required` is not `true`, `false` or a string.
- The MCP `simulate_path` tool lists visible fields from trimmed text answers.
