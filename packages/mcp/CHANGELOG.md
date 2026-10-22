# @formhaus/mcp

## 0.11.3

### Patch Changes

- Requires `@formhaus/core` 1.2.1.

## 0.11.2

### Patch Changes

- New `hiddenValues` engine option, `'clear'` (default) or `'keep'`. With `'keep'`, fields hidden by conditions keep their values in `engine.values` and in submitted values.
- With `'keep'`, conditions, validation and recall still treat hidden fields as unanswered, and hidden fields never block Continue or Submit.
- With `'keep'`, submitted values also hold the answers on steps off the active path. Fields of skipped steps stay out.
- `validateSubmission()` takes the same `hiddenValues` option. With `'keep'`, it checks hidden values like visible ones except `required`, and drops one that fails without an error.
- New `hiddenValues` prop on `FormRenderer` and `HeadlessFormRenderer`, and option of `useFormEngine`.
- `capabilities` in `@formhaus/mcp` describes `hiddenValues`.
- Requires `@formhaus/core` 1.2.0.

## 0.11.1

### Patch Changes

- `capabilities` says Formhaus Cloud hosted pages and embeds shuffle `randomize` options and store the shown order.
- The `formhaus-create-form` skill says Formhaus Cloud hosted pages shuffle `randomize` options.
- Requires `@formhaus/core` 1.1.1.

## 0.11.0

### Minor Changes

- Format 1.6: `"randomize": true` on a `radio`, `multiselect` or `select` field shows its options in a random order per respondent. Options with `"pinned": true` and exclusive options keep their written position.
- New `@formhaus/core/research` entry with option randomization. Pass its `research` object to apply the order. Without it, options show in written order, and development builds report `missing-research` once per page load through `onWarning`.
- New `research` and `seed` props on `FormRenderer`, `HeadlessFormRenderer` and `useFormEngine`, and engine options of the same names. The same seed shows the same order. `engine.seed` returns it.
- New `engine.orderOptions(key, options?)` returns the options of a field in shown order.
- Without `seed`, server rendering and hydration show the written order, and the shuffle applies after mount.
- `checkDefinition()` reports `randomize-not-applicable`, and `outdated-format-version` for `randomize` or `pinned` below format 1.6.
- `suggestFixes()` offers to remove `randomize` and `pinned` where they do not apply.
- `capabilities` in `@formhaus/mcp` describes `randomize`, `pinned` and the research module.

### Patch Changes

- Requires `@formhaus/core` 1.1.0.

## 0.10.2

### Patch Changes

- Requires `@formhaus/core` 1.0.1.

## 0.10.1

### Patch Changes

- Requires `@formhaus/core` 1.0.0.

## 0.10.0

### Minor Changes

- `validate_definition` and `fix_definition` report the issue codes of `@formhaus/core` 0.22: `min-greater-than-max`, `default-items-greater-than-max`, `group-item-limit` and `invalid-columns` replace `invalid-range`, `missing-label` replaces `empty-label` and the `missing-property` issue for a `label`, and `i18n-key-without-text` replaces `i18n-unbound-slot`.
- A missing `label` is reported at the path of the `label` property, such as `/fields/0/label`.

### Patch Changes

- Removed the `formhaus://migrate/0.11` resource. The 0.10 to 0.11 guide stays at https://formhaus.dev/migrate/0.11.
- Requires `@formhaus/core` 0.22.0.

## 0.9.2

### Patch Changes

- Requires `@formhaus/core` 0.21.2.

## 0.9.1

### Patch Changes

- Requires `@formhaus/core` 0.21.1.

## 0.9.0

### Minor Changes

- `capabilities` describes format 1.5: answer recall with `{{key}}`, exclusive `multiselect` options, the `autocomplete` property and line breaks in descriptions.
- `validate_definition` reports the new recall, exclusive and `autocomplete` warnings.
- `translation_template` lists the `or` and `select` labels and the `exclusive` message for forms that use them.

### Patch Changes

- Requires `@formhaus/core` 0.21.0.

## 0.8.2

### Patch Changes

- Requires `@formhaus/core` 0.20.2.

## 0.8.1

### Patch Changes

- Requires `@formhaus/core` 0.20.1.

## 0.8.0

### Minor Changes

- `capabilities` lists the `contains` and `notContains` condition operators for `multiselect` answers.
- `validate_definition` reports the `contains-not-list` and `contains-not-in-options` warnings.

### Patch Changes

- `capabilities` describes the `clear`, `done`, `chooseFile`, `required`, `skip`, `submit`, `stepTitle` and `stepErrors` labels.
- Requires `@formhaus/core` 0.20.0.

## 0.7.1

### Patch Changes

- Requires `@formhaus/core` 0.19.1.

## 0.7.0

### Minor Changes

- `capabilities` lists the `scale` and `rating` field types, anchor options, picture options with `image`, matrix sections and empty steps for welcome screens.
- `example_definitions` adds `product-survey`: a welcome step, an NPS scale, a rating, picture choice and a matrix.
- `validate_definition` accepts `autoAdvance` on `scale` and `rating` and warns about it on matrix rows.
- New warnings: `scale-range`, `rating-min`, `anchor-out-of-range`, `anchor-not-shown`, `matrix-options-mismatch`, `matrix-row-type`, `matrix-too-wide` and `image-not-applicable`.
- `simulate_path` moves past a `next: false` step once its `autoAdvance` scale or rating is answered.
- **Breaking:** Minimum Node is `22.12`.

### Patch Changes

- Fixed `validate_definition` and `simulate_path` throwing on a section or group whose `fields` is missing or not an array, and on `null` entries in `fields` or `steps`. They now return the validation errors.
- The MCP Registry name is now `io.github.formhaus-dev/formhaus`.
- Requires `@formhaus/core` 0.19.0.

## 0.6.3

### Patch Changes

- Requires `@formhaus/core` 0.18.0.

## 0.6.2

### Patch Changes

- Requires `@formhaus/core` 0.17.0.

## 0.6.1

### Patch Changes

- Requires `@formhaus/core` 0.16.0.

## 0.6.0

### Minor Changes

- `capabilities` describes the `props` field property and reports format 1.2.
- `capabilities` states that a field shown again gets back its last value, or else its initial value or `defaultValue`.
- `capabilities` and `validate_definition` accept a `hidden` field without a `label`.
- `simulate_path` gives the item fields of answered group items their `defaultValue`.

### Patch Changes

- Requires `@formhaus/core` 0.15.0.

## 0.5.2

### Patch Changes

- Requires `@formhaus/core` 0.14.2.

## 0.5.1

### Patch Changes

- Requires `@formhaus/core` 0.14.1.

## 0.5.0

### Minor Changes

- `validate_definition` returns `fixes` on issues it can repair, each with a JSON Patch.
- New `fix_definition` tool applies every safe fix and returns the repaired definition and the issues left.
- `capabilities` describes the `source` property of `hidden` fields.
- `capabilities` describes sections and repeatable groups, their translation slots and the new `addItem`, `removeItem`, `itemLabel`, `itemAdded` and `itemRemoved` labels, and reports format 1.1.
- `validate_definition` reports the new `group-scope`, `invalid-nesting` and `outdated-format-version` issues, and warns about `autoAdvance` on a radio inside a group.
- `simulate_path` accepts group answers as arrays of item objects and lists item fields and their errors by path, such as `participants.0.email`.
- New `event-registration` example with a conditional section and a group of participants.
- `capabilities` lists the `time` and `hidden` field types and describes their values.

### Patch Changes

- Tools that take a definition reject one larger than 256 KB of JSON with a `too-large` error.
- `validate_definition` reports unknown properties as `unknown-property` errors with a suggested property name, and missing properties as `missing-property` errors on the object that lacks them, instead of the `schema` code.
- The server sends usage instructions to the client on connect: the recommended tool order and the `FORMHAUS_API_KEY` and `FORMHAUS_API_BASE` environment variables.
- Tool descriptions say when to call each tool.
- Requires `@formhaus/core` 0.14.0.

## 0.4.2

### Patch Changes

- Updated dependencies [5752683]
  - @formhaus/core@0.13.2

## 0.4.1

### Patch Changes

- 25d738b: - The `list_forms` description no longer mentions a monthly submission limit. Formhaus Cloud responses are unlimited on every plan.
- 1a4874a: - Fixed `publish_form`, `list_forms`, `get_submissions`, `update_form_settings` and `get_webhook` failing the output schema check of MCP clients.
  - Fixed `simulate_path` leaving out fields shown by the default value of a skipped step when that value has surrounding spaces.
  - Fixed `simulate_path` returning a non-string `title` for a form without a string title.
- Updated dependencies [a5c775e]
- Updated dependencies [49485c8]
- Updated dependencies [1a4874a]
- Updated dependencies [5ea6229]
  - @formhaus/core@0.13.1

## 0.4.0

### Minor Changes

- fe4a968: - New `translation_template` tool returns the translation file skeleton and the list of translatable texts of a definition.
  - `simulate_path` takes an `overlay` and reports errors in its language. `overlayIssues` lists overlay entries it ignored.
  - `capabilities` lists message and label keys with their English defaults, `i18n` slots and translation file addresses.
  - `validate_definition` checks `lang`, `messages`, `labels` and `i18n` with the translation checks of core.
  - New `feedback-ru` example, a Russian form with message and label catalogs.
  - Fixed `capabilities` failing the output schema check of MCP clients.

### Patch Changes

- Updated dependencies [fe4a968]
  - @formhaus/core@0.13.0

## 0.3.4

### Patch Changes

- Updated dependencies [9298412]
  - @formhaus/core@0.12.0

## 0.3.3

### Patch Changes

- 5daae4d: - `show`, `showAny` and step `routes` conditions compare trimmed text answers. `" yes "` matches `eq: "yes"` and a text answer with only spaces fails `notEmpty`, the same as in `validateSubmission()`.
  - `checkDefinition()` and the `FormEngine` constructor report `invalid-type` when a validation `*Message` is not a string or `required` is not `true`, `false` or a string.
  - The MCP `simulate_path` tool lists visible fields from trimmed text answers.
- Updated dependencies [5daae4d]
  - @formhaus/core@0.11.3

## 0.3.2

### Patch Changes

- 434db0c: - `simulate_path` refuses Next while the `disabled` conditions of the step `next` action match.
  - `simulate_path` returns `wouldSubmit: false` while the `disabled` conditions of `submit` match.
- 960d281: - Definitions can declare their format version with `formatVersion`. A core that does not support it reports `unsupported-format-version`.
  - New `FORMAT_VERSION` export names the definition format this core reads.
  - The MCP `capabilities` tool reports the supported definition format version.
- Updated dependencies [434db0c]
- Updated dependencies [4fb22ad]
- Updated dependencies [960d281]
- Updated dependencies [97441bb]
  - @formhaus/core@0.11.2

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
