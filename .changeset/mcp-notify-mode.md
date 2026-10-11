---
"@formhaus/mcp": minor
---

- **Breaking:** `update_form_settings` `notify_mode` accepts `milestones` (default) and `off`. `instant` and `daily` are no longer accepted.
- `notify_mode` `milestones` emails at the 1st, 10th, 100th, 500th, 1,000th, 5,000th, 10,000th, 25,000th, 50,000th and 100,000th response of a form, without response values.
- `notify_email` `true` now means `milestones`.
