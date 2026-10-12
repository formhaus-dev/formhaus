# Installing the Formhaus MCP server

Two options with different tools. The remote server publishes and manages Formhaus Cloud forms. The local npm server also checks definitions offline.

## Remote server (no install)

Tools: `publish_form`, `list_forms`, `get_submissions`, `update_form_settings`, `get_webhook`, `reveal_webhook_secret`, `delete_form`.

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

Requires Node 20 or later. Tools: `validate_definition`, `simulate_path`, `capabilities` and `example_definitions` run offline and check form definitions. `publish_form`, `list_forms`, `get_submissions` and `update_form_settings` call the Formhaus Cloud REST API. `delete_form` is only on the remote server.

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
