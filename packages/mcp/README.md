# @formhaus/mcp

MCP server that lets AI agents check [Formhaus](https://github.com/ignsm/formhaus) form definitions against the real `@formhaus/core` engine. Runs over stdio. Requires Node 20 or later.

## Setup

Claude Code plugin, with the Formhaus skills:

```bash
claude plugin marketplace add ignsm/formhaus
claude plugin install formhaus@formhaus
```

Inside a Claude Code session, `/plugin marketplace add ignsm/formhaus` and `/plugin install formhaus@formhaus` do the same after a confirmation prompt.

Claude Code, server only:

```bash
claude mcp add formhaus -- npx -y @formhaus/mcp
```

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

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `validate_definition` | `definition` (object or JSON string) | `{ valid, errors, warnings }` |
| `simulate_path` | `definition`, `answers`, optional `actions` (`next`, `back`, `skip`) | Active step path with visible fields, action trace, validation `errors`, `wouldSubmit`, `submitValues` |
| `capabilities` | none | Field types, field props, validation rules, condition operators, step and route semantics, adapters |
| `example_definitions` | optional `id` | List of bundled examples, or one definition |
| `publish_form` | `definition`, optional `form_id`, `email`, `success_message`, `redirect_url` | `form_id`, `endpoint`, `hosted_url`, `embed_snippet`, `react_snippet`, `dashboard_url`, `warnings` |
| `list_forms` | none | Forms the API key reaches with status, version, submission count and endpoint |
| `get_submissions` | `form_id`, optional `limit`, `cursor` | `submissions` and `next_cursor` |
| `update_form_settings` | `form_id`, optional `webhook_url`, `notify_email`, `notify_mode`, `success_message`, `redirect_url`, `status`, `reveal_secret` | `form_id`, `status`, `success_message`, `redirect_url`, `notify_email`, `webhook_url`, `webhook_secret` |

`publish_form`, `list_forms`, `get_submissions` and `update_form_settings` call Formhaus Cloud at `https://api.formhaus.dev`. The last three need `FORMHAUS_API_KEY` in the server environment, and `publish_form` uses it when set. An account key (`fh_live_...`) reaches every form and all four tools. An agent key (`fh_agent_...`, returned once by the first keyless `publish_form`) reaches only the forms it created, and `update_form_settings` needs an account key. Save `agent_key` as `FORMHAUS_API_KEY` in `.env` and restart the server with it.

`simulate_path` applies `answers` as initial values, then presses the actions in order, or Next until the last step or the first blocking error. `errors` covers visited steps only. Custom validators, `onStepValidate` and lifecycle hooks are not run. The capabilities are also available as the `formhaus://capabilities` resource.

The tool handlers are exported for use without MCP:

```ts
import { simulatePathTool, validateDefinitionTool } from '@formhaus/mcp';

const report = await validateDefinitionTool({ definition });
const result = await simulatePathTool({ definition, answers: { kind: 'business' } });
```

See the [MCP guide](https://formhaus.dev/guide/mcp.html) for an example output.

## License

MIT
