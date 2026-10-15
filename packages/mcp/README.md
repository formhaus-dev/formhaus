# @formhaus/mcp

[![ignsm/formhaus MCP server](https://glama.ai/mcp/servers/ignsm/formhaus/badges/score.svg)](https://glama.ai/mcp/servers/ignsm/formhaus)

MCP server that lets AI agents check [Formhaus](https://github.com/ignsm/formhaus) form definitions against the real `@formhaus/core` engine. Runs over stdio. Requires Node 20 or later. The checks need no account or key.

`validate_definition`, `fix_definition`, `simulate_path`, `translation_template`, `capabilities` and `example_definitions` run offline. The other tools publish forms, read submissions and manage settings in [Formhaus Cloud](https://formhaus.dev/cloud/overview). If the app has its own backend, keep the data there and don't publish without the user's consent.

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
| `validate_definition` | `definition` (object or JSON string) | `{ valid, issues }`. Each issue has `code`, `severity`, a JSON pointer `path`, `message`, `hint` and, when a repair is known, `fixes` (`{ title, safe, patch }` with an RFC 6902 JSON Patch) |
| `fix_definition` | `definition` (object or JSON string) | `{ definition, applied, valid, issues }`: the definition with every safe fix applied, the fixes applied and the issues left |
| `simulate_path` | `definition`, `answers`, optional `actions` (`next`, `back`, `skip`) and `overlay` | Active step path with visible fields, action trace, `validation` (`{ valid, issues }`), field `errors`, `wouldSubmit`, `submitValues`. Group item fields appear as paths such as `participants.0.email` |
| `capabilities` | none | Field types, sections, repeatable groups, field props, validation rules, condition operators, step and route semantics, translation catalogs, keys and overlay addresses, adapters |
| `translation_template` | `definition`, `lang`, optional `prefix` | `overlay` skeleton with the source texts, suggested `file` name and `slots` with address, key, placeholders and hash |
| `example_definitions` | optional `id` | List of bundled examples, or one definition |
| `publish_form` | `definition`, optional `form_id`, `email`, `success_message`, `redirect_url` | `form_id`, `endpoint`, `hosted_url`, `embed_snippet`, `react_snippet`, `dashboard_url`, `warnings` |
| `list_forms` | none | Forms the API key reaches with status, version, submission count and endpoint |
| `get_submissions` | `form_id`, optional `limit`, `cursor` | `submissions` and `next_cursor` |
| `update_form_settings` | `form_id`, optional `webhook_url`, `notify_mode`, `success_message`, `redirect_url`, `status` | `form_id`, `status`, `success_message`, `redirect_url`, `notify_mode`, `webhook_url`, masked `webhook_secret` |
| `get_webhook` | `form_id` | `url` and the masked `secret` |
| `reveal_webhook_secret` | `form_id` | `form_id` and the full `webhook_secret`. Marked as a non-read-only, sensitive tool. Whether the client asks first depends on its permission settings |

`publish_form`, `list_forms`, `get_submissions` and `update_form_settings` call Formhaus Cloud at `https://api.formhaus.dev`. The last three need `FORMHAUS_API_KEY` in the server environment, and `publish_form` uses it when set. An account key (`fh_live_...`) reaches every form and all four tools. An agent key (`fh_agent_...`, returned once by the first keyless `publish_form`) reaches only the forms it created, and `update_form_settings` needs an account key. The server reads `FORMHAUS_API_KEY` from its own environment, not from the project `.env`. Add it to the `env` of the formhaus server in your MCP client config (for example `.mcp.json` with `${FORMHAUS_API_KEY}` and the value in your shell or a gitignored `.env` your client loads), then restart the server. `FORMHAUS_API_BASE` overrides the API URL. The server also sends short usage instructions to the client on connect.

`simulate_path` applies `answers` as initial values, with group answers as arrays of item objects, then presses the actions in order, or Next until the last step or the first blocking error. `errors` covers visited steps only. Custom validators, `onStepValidate` and lifecycle hooks are not run. The capabilities are also available as the `formhaus://capabilities` resource.

The tool handlers are exported for use without MCP:

```ts
import { simulatePathTool, validateDefinitionTool } from '@formhaus/mcp';

const report = await validateDefinitionTool({ definition });
const result = await simulatePathTool({ definition, answers: { kind: 'business' } });
```

See the [MCP guide](https://formhaus.dev/guide/mcp.html) for an example output.

## License

MIT
