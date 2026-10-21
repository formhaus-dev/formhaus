# formhaus

## 0.21.4

### Patch Changes

- `capabilities` says Formhaus Cloud hosted pages and embeds shuffle `randomize` options and store the shown order.
- The `formhaus-create-form` skill says Formhaus Cloud hosted pages shuffle `randomize` options.

## 0.21.3

### Patch Changes

- The `formhaus-create-form` skill sets format 1.6 for `randomize` and `pinned`, and describes them.

## 0.21.2

No changes in this release.

## 0.21.1

No changes in this release.

## 0.21.0

### Patch Changes

- The `formhaus-create-form` skill describes answer recall, exclusive options and `autocomplete`, and sets format 1.5 for them.

## 0.20.2

No changes in this release.

## 0.20.1

No changes in this release.

## 0.20.0

### Patch Changes

- The `formhaus-create-form` skill and the Cursor rule test `multiselect` answers with `contains`.

## 0.19.1

No changes in this release.

## 0.19.0

### Minor Changes

- Version now matches `@formhaus/core`, `@formhaus/react` and `@formhaus/vue`.
- **Breaking:** Minimum Node is `22.12`.

### Patch Changes

- Setup output lists each agent on one line and ends with next steps: restart your agents, ask for a form, render it or publish it on Formhaus Cloud.
- A second run says `already set up` for each agent.
- New `--verbose` flag lists every file checked or changed and the `.bak` backups. File paths are hidden without it.
- Status symbols are colored only in a terminal. `NO_COLOR` turns color off.
- The Claude Code skill `formhaus-create-form` writes `scale`, `rating`, picture options, matrix sections and welcome steps, and branches on scores with `gte` and `lte`.

## 0.14.3

### Patch Changes

- `npx formhaus` keeps your edits to the Cursor rule and the Claude Code skill. `--force` replaces them and saves your version as `.bak`.
- Finds the project root from a nested folder for the Cursor rule.
- Explains why the Cursor rule is skipped outside a project.

## 0.14.2

### Patch Changes

- New `npx formhaus` adds the Formhaus MCP server to Claude Code, Codex, Cursor and Claude Desktop.
- Installs the `formhaus-create-form` skill in Claude Code and the Formhaus rule in a project's `.cursor/rules`.
- `--dry-run` prints the planned changes without writing.
