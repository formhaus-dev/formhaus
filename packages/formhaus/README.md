# formhaus

Adds the [Formhaus](https://formhaus.dev) MCP server and agent instructions to the coding agents on your machine.

```bash
npx formhaus
```

Run it inside a project to also add the Cursor rule there. Requires Node 20 or later.

## What it changes

| Agent | Detected by | Change |
|-------|-------------|--------|
| Claude Code | `claude` on `PATH` | `claude mcp add --scope user formhaus -- npx -y @formhaus/mcp` and the `formhaus-create-form` skill in `~/.claude/skills` |
| Codex | `~/.codex` or `codex` on `PATH` | `[mcp_servers.formhaus]` in `~/.codex/config.toml` |
| Cursor | `~/.cursor` or `cursor` on `PATH` | `formhaus` in `~/.cursor/mcp.json`, and `.cursor/rules/formhaus.mdc` when run inside a project |
| Claude Desktop | its config directory on macOS and Windows | `formhaus` in `claude_desktop_config.json` |

Windsurf, Gemini CLI, OpenCode, VS Code and Claude Desktop on Linux are detected and listed with manual setup steps.

Existing entries are kept. An existing `formhaus` server with another command or args is reported and left unchanged, and a project `.mcp.json` never counts as set up. Before the first change to a file, the original is saved as `<file>.bak`. Formhaus does not write through symbolic links. Running it again changes nothing. If the Formhaus Claude Code plugin is installed, Claude Code is left as is.

## Options

```
npx formhaus [setup] [options]

  --dry-run      Show the planned changes and write nothing
  -h, --help     Show help
  -v, --version  Show the version
```

The exit code is 0 when every agent is set up, including when nothing changed, and 1 when a step fails.

[MCP server guide](https://formhaus.dev/guide/mcp) · MIT
