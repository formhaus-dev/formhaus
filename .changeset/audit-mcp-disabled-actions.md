---
'@formhaus/mcp': patch
---

- `simulate_path` refuses Next while the `disabled` conditions of the step `next` action match.
- `simulate_path` returns `wouldSubmit: false` while the `disabled` conditions of `submit` match.
