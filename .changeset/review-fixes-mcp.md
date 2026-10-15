---
'@formhaus/mcp': patch
---

- Fixed `publish_form`, `list_forms`, `get_submissions`, `update_form_settings` and `get_webhook` failing the output schema check of MCP clients.
- Fixed `simulate_path` leaving out fields shown by the default value of a skipped step when that value has surrounding spaces.
- Fixed `simulate_path` returning a non-string `title` for a form without a string title.
