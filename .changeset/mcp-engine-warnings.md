---
"@formhaus/mcp": patch
---

- `validate_definition` returns unknown `validator` names as warnings instead of logging them to stderr.
- `validate_definition` reports duplicate step ids with their path in forms with routes too.
