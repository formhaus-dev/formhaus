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
| Claude Desktop | its config directory | `formhaus` in `claude_desktop_config.json` |

Windsurf, Gemini CLI, OpenCode and VS Code are detected and listed with manual setup steps.

Existing entries are kept. A file is backed up to `<file>.bak` before it is changed. Running it again changes nothing. If the Formhaus Claude Code plugin is installed, Claude Code is left as is.

## Options

```
npx formhaus [setup] [options]

  --dry-run      Show the planned changes and write nothing
  -y, --yes      Run without prompts (formhaus never prompts)
  -h, --help     Show help
  -v, --version  Show the version
```

The exit code is 0 when every agent is set up, including when nothing changed, and 1 when a step fails.

[MCP server guide](https://formhaus.dev/guide/mcp) · MIT
