# @formhaus/mcp

## 0.3.1

### Patch Changes

- Updated dependencies [2d103ac]
  - @formhaus/core@0.11.1

## 0.3.0

### Minor Changes

- e8cdb54: - `capabilities` lists the `gt`, `gte`, `lt` and `lte` condition operators.
- dec39c2: - Every tool declares an `outputSchema` and returns `structuredContent`.
  - The `definition` input describes the top-level shape, the `validation` object and the condition syntax, and links the JSON Schema.
  - JSON Schema issues have hints: a rule such as `required` placed on the field says to move it into `validation`, and an unknown condition key lists the operators.
  - New `get_webhook` tool reads the webhook URL and the masked signing secret of a form.
  - New `reveal_webhook_secret` tool returns the full signing secret. It is not read-only, so MCP clients ask the user before running it.
  - `capabilities` describes the comparison operators, the one-operator rule and which earlier answers a condition can use.
  - **Breaking:** `validate_definition` returns `{ valid, issues }` instead of `{ valid, errors, warnings }`. Each issue has `code`, `severity`, a JSON pointer `path`, `message` and `hint`. Read `issues.filter((issue) => issue.severity === 'error')` for the errors.
  - **Breaking:** `simulate_path` returns `validation` as `{ valid, issues }` instead of `{ valid, errors, warnings }`. Read `validation.issues`.
  - **Breaking:** `update_form_settings` no longer accepts `reveal_secret` and never returns the full secret. Call `reveal_webhook_secret` for it.
  - **Breaking:** `update_form_settings` no longer accepts `notify_email`. Use `notify_mode`: `"milestones"` or `"off"`.
- 995ab4b: - New `formhaus://migrate/0.11` resource with the 0.10 to 0.11 migration guide.

### Patch Changes

- Updated dependencies [d074148]
- Updated dependencies [03a5b5f]
- Updated dependencies [726b3fd]
- Updated dependencies [e8cdb54]
- Updated dependencies [f1ccf3a]
- Updated dependencies [31e96b6]
- Updated dependencies [6a04469]
- Updated dependencies [a1eb753]
- Updated dependencies [0ba2078]
- Updated dependencies [7fcb7a3]
  - @formhaus/core@0.11.0

## 0.2.1

### Patch Changes

- 0414183: - `inputMode` accepts `decimal`, `url` and `search`.
- Updated dependencies [8630259]
- Updated dependencies [8630259]
- Updated dependencies [0414183]
- Updated dependencies [a15c07f]
- Updated dependencies [26eb04c]
- Updated dependencies [4d656df]
  - @formhaus/core@0.10.1

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
