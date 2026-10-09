# @formhaus/mcp

MCP server that lets AI agents check [Formhaus](https://github.com/ignsm/formhaus) form definitions against the real `@formhaus/core` engine. Runs over stdio. Requires Node 20 or later.

## Setup

Claude Code:

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
