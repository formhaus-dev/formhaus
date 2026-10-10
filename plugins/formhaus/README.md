# Formhaus plugin for Claude Code

Generate, validate and simulate [Formhaus](https://formhaus.dev) form definitions, and bind a Figma design system to the Formhaus Figma plugin.

A Formhaus form definition is a JSON file that describes fields, validation, conditional fields, multi-step navigation and branching routes. The same file renders in React and Vue with `@formhaus/react` and `@formhaus/vue`, and in Figma with the Formhaus plugin.

## Install

```bash
claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus
```

## What it adds

| Part | What it does |
| --- | --- |
| `/formhaus:formhaus-create-form` | Turns a text description, a table or a screenshot of a form into a definition, then checks it with the MCP tools. |
| `/formhaus:formhaus-figma-connect` | Finds form components in your Figma libraries through the Figma MCP server and binds them to the Formhaus Figma plugin. |
| MCP server `@formhaus/mcp` | `validate_definition`, `simulate_path`, `capabilities`, `example_definitions`, `publish_form`, `list_forms` and `get_submissions`. Runs locally with `npx -y @formhaus/mcp`. |

## Data

The MCP server runs locally over stdio. `validate_definition`, `simulate_path`, `capabilities` and `example_definitions` make no network requests. `publish_form`, `list_forms` and `get_submissions` send requests to `https://api.formhaus.dev`; `publish_form` sends the definition you ask it to publish. The Figma skill uses your own Figma MCP connection.

## Links

- Docs: https://formhaus.dev/guide/mcp.html
- Recipe: https://formhaus.dev/recipes/ai-agents.html
- Source and issues: https://github.com/ignsm/formhaus

## License

MIT
