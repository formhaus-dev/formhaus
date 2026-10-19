# formhaus

Adds the [Formhaus](https://formhaus.dev) MCP server and agent instructions to the coding agents on your machine.

```bash
npx formhaus
```

Run it anywhere inside a project to also add the Cursor rule at the project root: the nearest folder above with `.git`, `package.json` or `.cursor`, below your home directory. Requires Node 22.12 or later.

```text
Formhaus is ready in Claude Code, Codex, Cursor and Claude Desktop.

  ✓ Claude Code     added MCP server and form skill
  ✓ Codex           added MCP server
  ✓ Cursor          added MCP server · run in a project to add the Cursor rule
  ✓ Claude Desktop  added MCP server
  – OpenCode        add it by hand: https://formhaus.dev/guide/mcp

Next
  1. Restart your agents.
  2. Ask one: "Build a contact form with Formhaus: name, email, message."
  3. Show it on your site: npm i @formhaus/core @formhaus/react
     For Vue use @formhaus/vue. Guide: https://formhaus.dev/guide/
     No site? Publish it and collect responses at https://app.formhaus.dev

Config backups were saved as .bak. See every file: npx formhaus --verbose
```

Running it again prints `already set up` for each agent. A step that fails is marked `✗` with the fix below it, and the exit code is 1. Symbols are colored only in a terminal, and `NO_COLOR` turns color off.

## What next

1. Restart your agents so they load the Formhaus MCP server.
2. Ask one to build a form: "Build a contact form with Formhaus: name, email, message."
3. Render the definition with `npm i @formhaus/core @formhaus/react` or `@formhaus/vue`. See [Getting started](https://formhaus.dev/guide/).
4. Or publish it without code and collect responses at [app.formhaus.dev](https://app.formhaus.dev).

## What it changes

| Agent | Detected by | Change |
|-------|-------------|--------|
| Claude Code | `claude` on `PATH` | `claude mcp add --scope user formhaus -- npx -y @formhaus/mcp` and the `formhaus-create-form` skill in `~/.claude/skills` |
| Codex | `~/.codex` or `codex` on `PATH` | `[mcp_servers.formhaus]` in `~/.codex/config.toml` |
| Cursor | `~/.cursor` or `cursor` on `PATH` | `formhaus` in `~/.cursor/mcp.json`, and `.cursor/rules/formhaus.mdc` at the project root |
| Claude Desktop | its config directory on macOS and Windows | `formhaus` in `claude_desktop_config.json` |

Windsurf, Gemini CLI, OpenCode, VS Code and Claude Desktop on Linux are detected and listed with a link to the manual setup steps.

Existing entries are kept. An existing `formhaus` server with another command or args is reported and left unchanged, and a project `.mcp.json` never counts as set up. Before the first change to a config file, the original is saved as `<file>.bak`. If you edited the Cursor rule or the skill, Formhaus keeps your version. `--force` replaces it and saves your version as `<file>.bak`. Formhaus does not write to a file that is a symbolic link, or through a linked directory inside the project. Running it again changes nothing. If the Formhaus Claude Code plugin is installed, Claude Code is left as is.

## Options

```
npx formhaus [setup] [options]

  --dry-run      Show the planned changes and write nothing
  --force        Replace your edited skill and rule, saving them as .bak
  --verbose      List every file it checks or changes, and the backups
  -h, --help     Show help
  -v, --version  Show the version
```

The exit code is 0 when every agent is set up, including when nothing changed, and 1 when a step fails.

[MCP server guide](https://formhaus.dev/guide/mcp) · MIT
