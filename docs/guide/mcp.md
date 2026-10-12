---
description: "Check Formhaus definitions from Claude Code, Claude Desktop or Cursor with validate_definition, simulate_path, capabilities, example_definitions and publish_form."
---

# MCP Server

`@formhaus/mcp` is an MCP server that lets AI agents check Formhaus definitions against the real engine. It runs over stdio and needs Node 20 or later.

## Setup

### Claude Code plugin

The Formhaus plugin bundles this server with the [`/formhaus:formhaus-create-form`](/guide/formhaus-create-form) and [`/formhaus:formhaus-figma-connect`](/guide/formhaus-figma-connect) skills:

```bash
claude plugin marketplace add ignsm/formhaus
claude plugin install formhaus@formhaus
```

Inside a Claude Code session, `/plugin marketplace add ignsm/formhaus` and `/plugin install formhaus@formhaus` do the same after a confirmation prompt.

### Claude Code, server only

```bash
claude mcp add formhaus -- npx -y @formhaus/mcp
```

### Claude Desktop and Cursor

Claude Desktop (`claude_desktop_config.json`) and Cursor (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "formhaus": {
      "command": "npx",
      "args": ["-y", "@formhaus/mcp"]
    }
  }
}
```

### Cursor rule

Copy [`.cursor/rules/formhaus.mdc`](https://github.com/ignsm/formhaus/blob/main/.cursor/rules/formhaus.mdc) into your project's `.cursor/rules/`. It describes Formhaus definitions and tells Cursor to validate them with this server.

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/formhaus.mdc https://raw.githubusercontent.com/ignsm/formhaus/main/.cursor/rules/formhaus.mdc
```

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `validate_definition` | `definition` (object or JSON string) | `{ valid, issues }`. Each issue has `code`, `severity`, a JSON pointer `path`, `message` and `hint` |
| `simulate_path` | `definition`, `answers`, optional `actions` (`next`, `back`, `skip`) | Active step path with visible fields, action trace, `validation` (`{ valid, issues }`), field `errors`, `wouldSubmit`, `submitValues` |
| `capabilities` | none | Field types, field props, validation rules, condition operators, step and route semantics, adapters |
| `example_definitions` | optional `id` | List of bundled examples, or one definition |
| `publish_form` | `definition`, optional `form_id`, `email`, `success_message`, `redirect_url` | `form_id`, `version`, `endpoint`, `hosted_url`, `embed_snippet`, `react_snippet`, `vue_snippet`, `dashboard_url`, `warnings`; for unclaimed forms `claim_url`, `expires_at`; with a new agent key `agent_key`, `agent_key_notice` and, when `FORMHAUS_API_KEY` is not set, `agent_key_instructions` |
| `list_forms` | none | Forms the key reaches with status, version, submission count and endpoint |
| `get_submissions` | `form_id`, optional `limit`, `cursor` | `submissions` and `next_cursor` |
| `update_form_settings` | `form_id`, optional `webhook_url`, `notify_mode`, `success_message`, `redirect_url`, `status` | The form settings |
| `get_webhook` | `form_id` | The webhook URL and the masked signing secret |
| `reveal_webhook_secret` | `form_id` | The full signing secret. Not read-only, so MCP clients ask before running it |

`publish_form`, `list_forms`, `get_submissions`, `update_form_settings`, `get_webhook` and `reveal_webhook_secret` call Formhaus Cloud. `list_forms` and `get_submissions` need `FORMHAUS_API_KEY` in the server environment, `update_form_settings`, `get_webhook` and `reveal_webhook_secret` need an `fh_live_` key, and `publish_form` uses the key when set. `FORMHAUS_API_BASE` overrides the API origin. See [Cloud MCP reference](/cloud/mcp) for keys, results and errors.

Issues with `severity: "error"` come from the [JSON Schema](/api/definition) and from checks the engine rejects, such as a route to an earlier step or a condition with two operators. Warnings point to likely mistakes. Issue codes are listed in the [specification](/spec#definition-checks). Every tool declares an `outputSchema` and returns `structuredContent`.

`simulate_path` applies `answers` as initial values, then presses the actions in order. Without `actions` it presses Next until the last step or the first blocking error. Next is refused on `next: false` steps until an autoAdvance radio is answered. Skip works only on steps with `skip` and submits on the last step. `errors` covers visited steps only. Custom validators, `onStepValidate` and lifecycle hooks are not run.

The capabilities are also available as the `formhaus://capabilities` resource.

## Example

`simulate_path` with the `branching-account` definition from `example_definitions` and these answers:

```json
{ "kind": "business", "company": "Acme" }
```

Output, without the `validation` report:

```json
{
  "ok": true,
  "multiStep": true,
  "path": [
    { "id": "kind", "title": "Choose an account type", "visited": true, "skipped": false, "visibleFields": ["kind"] },
    { "id": "business", "title": "Company details", "visited": true, "skipped": false, "visibleFields": ["company"] },
    { "id": "review", "title": "Review and submit", "visited": true, "skipped": false, "visibleFields": [] }
  ],
  "currentStep": { "id": "review", "title": "Review and submit", "index": 2 },
  "isLastStep": true,
  "trace": [
    { "action": "next", "from": "kind", "to": "business", "moved": true },
    { "action": "next", "from": "business", "to": "review", "moved": true }
  ],
  "errors": {},
  "wouldSubmit": true,
  "submitValues": { "kind": "business", "company": "Acme" }
}
```
