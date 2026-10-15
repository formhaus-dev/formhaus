---
'@formhaus/mcp': minor
---

- `validate_definition` returns `fixes` on issues it can repair, each with a JSON Patch.
- New `fix_definition` tool applies every safe fix and returns the repaired definition and the issues left.
