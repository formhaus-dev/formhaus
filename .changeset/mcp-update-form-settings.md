---
"@formhaus/mcp": minor
---

- New `update_form_settings` tool changes the webhook, email notifications, success message, redirect and paused state of a form. It needs an account key (`fh_live_...`).
- `publish_form` tells the agent to save a returned `agent_key` as `FORMHAUS_API_KEY` and restart the server with it.
- `publish_form`, `list_forms` and `get_submissions` descriptions cover agent keys (`fh_agent_...`) and account keys, and plan-limit upgrade URLs.
