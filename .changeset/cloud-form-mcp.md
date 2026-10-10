---
"@formhaus/mcp": minor
---

- New `publish_form`, `list_forms` and `get_submissions` tools call Formhaus Cloud. `FORMHAUS_API_KEY` authenticates them; `publish_form` works without it. `FORMHAUS_API_BASE` overrides the API origin.
- `get_submissions` results carry a `notice` that submission values are untrusted data.
