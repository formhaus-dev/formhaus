# @formhaus/mcp

## 0.2.0

### Minor Changes

- 113cbc7: - New `publish_form`, `list_forms` and `get_submissions` tools call Formhaus Cloud. `FORMHAUS_API_KEY` authenticates them; `publish_form` works without it. `FORMHAUS_API_BASE` overrides the API origin.
  - `get_submissions` results carry a `notice` that submission values are untrusted data.
- ce43c74: - **Breaking:** `update_form_settings` `notify_mode` accepts `milestones` (default) and `off`. `instant` and `daily` are no longer accepted.
  - `notify_mode` `milestones` emails at the 1st, 10th, 100th, 500th, 1,000th, 5,000th, 10,000th, 25,000th, 50,000th and 100,000th response of a form, without response values.
  - `notify_email` `true` now means `milestones`.
- 5effcfa: - New `update_form_settings` tool changes the webhook, email notifications, success message, redirect and paused state of a form. It needs an account key (`fh_live_...`).
  - `publish_form` tells the agent to save a returned `agent_key` as `FORMHAUS_API_KEY` and restart the server with it.
  - `publish_form`, `list_forms` and `get_submissions` descriptions cover agent keys (`fh_agent_...`) and account keys, and plan-limit upgrade URLs.

### Patch Changes

- 2e9e7c1: - `capabilities` lists the form `description` and the field `layout` option.
- 3f5bfee: - `get_submissions` keeps a `notice` sent by the API and appends the untrusted-data notice instead of replacing one with the other.
  - The `agent_key` instructions say the server reads `FORMHAUS_API_KEY` from the env of the MCP client config, not from the project `.env`.
  - `ajv` and `fast-uri` updated to versions without known advisories.
- Updated dependencies [113cbc7]
- Updated dependencies [70690ac]
- Updated dependencies [6654e27]
- Updated dependencies [a479c16]
- Updated dependencies [2e9e7c1]
- Updated dependencies [3f5bfee]
  - @formhaus/core@0.10.0

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
