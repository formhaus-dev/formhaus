# @formhaus/core

## 0.10.0

### Minor Changes

- 113cbc7: - `submitAsync()` and `skipStepAsync()` pass the ids of skipped steps as a second argument to the submit function.
  - New `@formhaus/core/cloud` entry with `fetchDefinition()`, `createSubmitter()`, `createCloudController()` and `CloudError` for forms hosted on Formhaus Cloud.
- 70690ac: - **Breaking:** `onError` in `FormhausForm` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
  - `FormhausForm` shows every failed submission in a notice above the form, with "Try again" for 429, 5xx and network failures. The notice takes focus. Entered values stay.
  - `FormhausForm` focuses the first field with a server error when there is no notice. Messages for keys the form does not render are listed in the notice.
  - `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, marks dropped answers with "Please answer again." and asks to review and submit again.
  - `FormhausForm` now renders the form inside a `div.fh-cloud` wrapper.
  - `CloudError.message` texts changed. `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`.
  - `createSubmitter()` takes an optional `version` next to `id` and `apiBase`.
  - New `.fh-form__notice` styles in `@formhaus/core/style.css`.
- 6654e27: - New `checkDefinition(definition)` in `@formhaus/core/server` and on the `Formhaus` IIFE global. It returns `{ errors, warnings }`: errors are definitions `FormEngine` rejects, warnings are the rest of `validateDefinition()`.
- a479c16: - New `@formhaus/core/server` entry with `validateSubmission(definition, values, { skippedSteps })`. It returns the submit values and errors for a submitted payload.
  - `validateSubmission()` drops unknown keys and values of hidden steps, hidden fields and skipped steps. It accepts a skip only for steps with `skip`.
  - `validateSubmission()` checks value types: text fields and `file` take strings, `number` takes numbers or decimal strings, `checkbox` and `switch` take booleans, choices must come from `options`.
  - `validateSubmission()` checks `email`, `date` (`YYYY-MM-DD`) and `datetime` (ISO 8601) formats.
  - `validateSubmission()` accepts only strings, numbers and booleans in custom field types.
  - `validateSubmission()` rejects strings over 10,000 characters or the field's `maxLength` before any rule runs. Custom `validators` are ignored.
  - New `@formhaus/core/server.iife.js` build exposes `validateSubmission` on a `Formhaus` global.
  - Shared submission fixtures ship in `@formhaus/core/fixtures/submissions/*.json`. Each file holds one definition and its cases.
- 2e9e7c1: - Form definitions accept an optional `description` of up to 1000 characters.
  - New `layout` field option for `radio` and `multiselect`: `"stack"` (default) or `"inline"`.
  - **Breaking:** redesigned default stylesheet. Custom CSS that targets field classes or relies on the helper and control order may need updating.
  - Default stylesheet changes: wider spacing between questions, 15px text, 10px radius, violet primary `#5502fb` instead of blue `#2563eb`.
  - Radio and multiselect options are full-width rows with hover, selected and focus states.
  - The primary button spans the full width on screens up to 480px.
  - Dark colors apply with `data-fh-theme="dark"` on the form or an ancestor. Without it the stylesheet stays light.
  - Hover and selected-option colors follow `--fh-color-primary`.
  - New custom properties `--fh-color-border-hover`, `--fh-color-primary-soft` and `--fh-control-height`.
  - Visible focus and checked states in Windows high contrast mode.
  - On touch screens the stylesheet uses 17px text and 15px helper and error text. Inputs stay at 16px or more, so iOS Safari does not zoom in on focus.
  - The whole checkbox and switch row toggles the control. On touch screens the row is at least 44px tall.

### Patch Changes

- 3f5bfee: - Field keys `__proto__`, `constructor`, `prototype` and the other `Object.prototype` property names are rejected by `FormEngine`, `validateDefinition`, `checkDefinition` and the JSON Schema. They bypassed `required`.

## 0.9.0

### Minor Changes

- ae557e6: - **Breaking:** The `FormEngine` constructor throws on duplicate step ids in forms without routes.
  - **Breaking:** `notEmpty` treats an empty array as empty, the same as `required`.
  - `validateField()` returns `null` when a validator returns `''`.
  - **Breaking:** In forms without routes, fields of a skipped step have no value for `matchField`, validators and step hooks, as in forms with routes.
  - `validateDefinition()` reports duplicate step ids in forms without routes.
  - `validateDefinition()` warns when a step condition in a routed form references a field of the same or a later step.
  - `validateDefinition()` says that `FormEngine` rejects a definition with both `fields` and `steps`, instead of saying `fields` is ignored.
  - The constructor error for a definition with both `fields` and `steps` now matches that warning text.
  - The `FormEngine` constructor warns about a `validator` name missing from the `validators` option.

## 0.8.0

### Minor Changes

- 75e49f2: - New JSON Schema for form definitions at `@formhaus/core/schema.json` and `https://formhaus.dev/schema/form-definition.json`.
- 2bd4c47: - New `skip` step option. A skipped step is left out of submit validation and submitted values.
  - New `skipStep()` and `skipStepAsync()` reset the current step to its defaults and move forward without validation.
  - `skipStepAsync(submit)` submits without the step when no step follows it. Without `submit` it returns `false` and changes nothing.
  - New `isStepSkipped()` method.
  - Pressing Next or Submit on a skipped step, or changing one of its fields, includes it again.
  - `StepChangeContext.reason` can be `'skip'`.
  - New `step_skipped` analytics event type.
  - `validateDefinition()` warns about `skip` on a single-step form or a step with `next: false`.

## 0.7.2

No changes. Version aligned with `@formhaus/react` and `@formhaus/vue`.

## 0.7.1

### Patch Changes

- 4371c19: - `required` on checkbox and switch fields rejects `false`, so a required box must be checked.
  - Changing an earlier answer that shows or hides another step no longer moves the user off the current step.
  - A `matchField` error clears once the referenced field makes the values match.
  - Errors on fields that leave the active route path are cleared.
  - New `shouldApplyExternalErrors()` helper for custom renderers.

## 0.7.0

### Minor Changes

- - New `onBeforeStepChange`, `onAfterStepChange`, `onBeforeSubmit` and `onAfterSubmit` options. A before-hook cancels the action by returning `false`.
  - New `prevStepAsync()`, `submitAsync()` and `cancelPendingActions()` methods and the `submitting` state.
  - New `FormLifecycleError` marks an after-hook failure for an action that already completed.
  - New `autoAdvance` field option and `next: false` step option.
  - New step `routes` choose the next step from answers. Exposes the `StepRoute` type.
  - `FormEngine` throws on invalid routes. `validateDefinition()` reports them and warns when a branch falls through into a sibling branch.

## 0.6.0

No changes. Version aligned with `@formhaus/react` and `@formhaus/vue`.

## 0.5.0

### Minor Changes

- ad80814: - New `subscribeField()`, `getFieldSnapshot()`, `subscribeStructure()`, and `getStructureSnapshot()` methods expose granular form updates.

### Patch Changes

- 76b2a0d: - `stepValidating` reads `false` in the notification that delivers async step-validation errors.
- 76b2a0d: - `setErrors()` surfaces errors from hidden steps at form level.
  - `reset()` clears loading state and discards pending step validation results.
  - Definition warnings include missing and circular step visibility dependencies.
- ad80814: - `visibleFields` no longer runs current-step validators.
- ad80814: - `reset()` clears values for fields that the reset values hide, instead of keeping them until the next change.
  - Construction clears initial values for fields that other initial values hide, matching `reset()`.
- ad80814: - Visibility cascades now clear dependency chains longer than 50 fields.
  - Deep visibility dependency graphs no longer overflow the call stack during definition validation.

## 0.4.0 - 2026-05-10

### Minor

- New `'autocomplete'` member of `DefaultFieldType` for type-to-filter dropdowns. The default React and Vue renderers use `<input>` + `<datalist>` (native browser filtering, SSR-safe). Note: native `<datalist>` filters by `value`, not `label`, and does not enforce that the typed value is one of the options. See the field types guide.
- New `'datetime'` member of `DefaultFieldType`. The default React and Vue renderers use `<input type="datetime-local">`, which emits `YYYY-MM-DDTHH:mm` without timezone. For richer pickers or ISO output, plug in your own component via `components`. See the field types guide.
- New optional baseline stylesheet at `@formhaus/core/style.css`. Import it for sensible default styling on the native field components: padding, focus state, error colour, button styles, step progress bar. Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). The `sideEffects` field is now `["**/*.css"]` so bundlers preserve the import.

### Patch

- Fixtures are no longer published to npm. They were demo data for the docs and playground, never reachable from consumer code (`exports` only declared the root entry, so `import x from '@formhaus/core/fixtures/basic-form.json'` failed under strict ESM anyway). The Quick Start guide now shows a literal definition object.
- Source maps now ship alongside the minified bundle. Stack traces in consumer apps point at the original source line in `src/`, not minified one-letter variables.
