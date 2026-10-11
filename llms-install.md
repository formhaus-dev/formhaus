# Installing the Formhaus MCP server

Two options. Both expose `publish_form`, `list_forms`, `get_submissions` and `update_form_settings`.

## Remote server (no install)

Add an HTTP MCP server with this URL:

```
https://api.formhaus.dev/mcp
```

Cline `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "formhaus": {
      "type": "streamableHttp",
      "url": "https://api.formhaus.dev/mcp"
    }
  }
}
```

## Local server (npm)

Requires Node 20 or later. Adds offline tools that check form definitions: `validate_definition`, `simulate_path`, `capabilities`, `example_definitions`.

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

## API key

Not needed for the first `publish_form`: it returns a form, a claim link and an agent key. To reach forms later, set `FORMHAUS_API_KEY` in the server's `env` (local server) or send `Authorization: Bearer <key>` (remote server).

Docs: https://formhaus.dev/guide/mcp
