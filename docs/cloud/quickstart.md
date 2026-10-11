---
title: "Cloud quickstart"
description: "Connect an agent to Formhaus Cloud over MCP, publish a form with publish_form, and claim it in the dashboard."
---

# Cloud quickstart

An agent publishes a definition with `publish_form`; a human claims the form in the dashboard.

## Agents

### Remote MCP server

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp
```

With a key, add the header. The MCP client sends it; a tool argument cannot.

```bash
claude mcp add --transport http formhaus https://api.formhaus.dev/mcp \
  --header "Authorization: Bearer $FORMHAUS_API_KEY"
```

In a `.mcp.json` file, refer to the environment variable so the file holds no secret:

```json
{
  "mcpServers": {
    "formhaus": {
      "type": "http",
      "url": "https://api.formhaus.dev/mcp",
      "headers": { "Authorization": "Bearer ${FORMHAUS_API_KEY}" }
    }
  }
}
```

The remote server has four tools: `publish_form`, `list_forms`, `get_submissions`, `update_form_settings`. See [MCP reference](/cloud/mcp).

### Local MCP server

`@formhaus/mcp` runs over stdio and proxies `publish_form`, `list_forms` and `get_submissions` to the [REST API](/cloud/rest-api). It reads the key from `FORMHAUS_API_KEY`.

```bash
claude mcp add formhaus -e FORMHAUS_API_KEY=$FORMHAUS_API_KEY -- npx -y @formhaus/mcp
```

| Variable | Default |
|---|---|
| `FORMHAUS_API_KEY` | None. `list_forms` and `get_submissions` need it. |
| `FORMHAUS_API_BASE` | `https://api.formhaus.dev` |

Requests time out after 15 seconds. Setup for Claude Desktop and Cursor is in [MCP Server](/guide/mcp).

### Claude Code plugin

The plugin runs the local server and adds the [`formhaus-create-form`](/guide/formhaus-create-form) skill.

```bash
claude plugin marketplace add ignsm/formhaus
claude plugin install formhaus@formhaus
```

### Publish

```text
Add a waitlist form with an email field to this site and publish it with Formhaus.
```

`publish_form` returns:

| Field | Value |
|---|---|
| `form_id` | 10 characters, `[A-Za-z0-9]` |
| `version` | Version number, starts at 1 |
| `endpoint` | `https://api.formhaus.dev/f/{form_id}` |
| `hosted_url` | `https://f.formhaus.dev/{form_id}` |
| `embed_snippet` | `<script src="https://f.formhaus.dev/embed.js" data-form="{form_id}" async></script>` |
| `react_snippet` | React component file with `FormhausForm` |
| `vue_snippet` | Vue single-file component with `FormhausForm` |
| `dashboard_url` | `https://app.formhaus.dev/forms/{form_id}` |
| `warnings` | Array of strings, empty when none |
| `claim_url` | Only for unclaimed forms |
| `expires_at` | Only for unclaimed forms |
| `agent_key`, `agent_key_notice` | Only when a call without a key creates a new agent key |

Store `agent_key` in `.env` as `FORMHAUS_API_KEY`. It is shown once. Without it, the next publish creates a new key and new forms. Never put a key in browser code: a page needs only `form_id`.

```bash
FORMHAUS_API_KEY=fh_agent_...
```

Key types and scopes are in [MCP reference](/cloud/mcp#keys).

## Humans

1. Open `claim_url` from the agent, or the link in the claim email.
2. Sign in: enter your email at `https://app.formhaus.dev/login` and open the link. The link is valid for 15 minutes; the session lasts 30 days.
3. Press **Claim**. The forms move to your current workspace and stop expiring. You need the editor or owner role there.
4. Optional: an owner creates an account key under **API keys** and gives it to the agent as `FORMHAUS_API_KEY`. The claimed agent key keeps working for the forms it created.

Next: [put the form on a site](/cloud/submissions).
