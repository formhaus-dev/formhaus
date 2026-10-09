# @formhaus/mcp

## 0.1.2

### Patch Changes

- ae557e6: - `validate_definition` returns unknown `validator` names as warnings instead of logging them to stderr.
  - `validate_definition` reports duplicate step ids with their path in forms with routes too.
- dd594b0: - `validate_definition` also reports structural and engine errors when a definition fails the JSON Schema.
- Updated dependencies [ae557e6]
  - @formhaus/core@0.9.0

## 0.1.1

### Patch Changes

- e71df6f: - Listed in the MCP Registry as `io.github.ignsm/formhaus`.

## 0.1.0

### Minor Changes

- 93e3be6: - New MCP server with `validate_definition`, `simulate_path`, `capabilities` and `example_definitions` tools. Run it with `npx @formhaus/mcp`. Requires Node 20.
