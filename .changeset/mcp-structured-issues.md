---
"@formhaus/mcp": minor
---

- Every tool declares an `outputSchema` and returns `structuredContent`.
- The `definition` input describes the top-level shape, the `validation` object and the condition syntax, and links the JSON Schema.
- JSON Schema issues have hints: a rule such as `required` placed on the field says to move it into `validation`, and an unknown condition key lists the operators.
- New `get_webhook` tool reads the webhook URL and the masked signing secret of a form.
- New `reveal_webhook_secret` tool returns the full signing secret. It is not read-only, so MCP clients ask the user before running it.
- `capabilities` describes the comparison operators, the one-operator rule and which earlier answers a condition can use.
- **Breaking:** `validate_definition` returns `{ valid, issues }` instead of `{ valid, errors, warnings }`. Each issue has `code`, `severity`, a JSON pointer `path`, `message` and `hint`. Read `issues.filter((issue) => issue.severity === 'error')` for the errors.
- **Breaking:** `simulate_path` returns `validation` as `{ valid, issues }` instead of `{ valid, errors, warnings }`. Read `validation.issues`.
- **Breaking:** `update_form_settings` no longer accepts `reveal_secret` and never returns the full secret. Call `reveal_webhook_secret` for it.
- **Breaking:** `update_form_settings` no longer accepts `notify_email`. Use `notify_mode`: `"milestones"` or `"off"`.
