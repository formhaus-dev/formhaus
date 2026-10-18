---
"@formhaus/mcp": patch
---

Fixed `validate_definition` and `simulate_path` throwing on a section or group whose `fields` is missing or not an array, and on `null` entries in `fields` or `steps`. They now return the validation errors.
