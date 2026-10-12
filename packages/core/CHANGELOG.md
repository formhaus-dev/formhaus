# @formhaus/core

## 0.11.1

### Patch Changes

- `FormhausForm` keeps the response when it is sent again right after a "form updated" notice.
- 2d103ac: - `FormEngine` is 8.9 KB gzipped in production builds, down from 10.6 KB.
  - In production builds, and in a browser without a bundler where `process` is not defined, the `FormEngine` constructor runs only the error checks. It no longer passes warnings to `onWarning`, and its errors have no typo suggestions. Call `checkDefinition()` to get warnings in production.

## 0.11.0

### Minor Changes

- d074148: - Two fields may share a key on route branches that never meet on one path. The field on the active path owns the value and its rules.
  - **Breaking:** `show`, `showAny`, route and `disabled` conditions see only the active projection, with or without routes: visible values of earlier steps on the path plus the condition's own step. A field condition on a field of a later step makes the constructor throw. Move the referenced field to the same or an earlier step.
  - **Breaking:** a step `show` or `showAny` on a field of the same or a later step makes the constructor throw in forms without routes too. Move the referenced field to an earlier step.
  - **Breaking:** a condition or `matchField` on a key that is not a field key makes the constructor throw instead of logging a warning. Initial values for such keys no longer affect conditions. Add a field with that key on an earlier step.
  - **Breaking:** without routes, `setValue()` on a hidden field clears the value at once instead of keeping it until a referenced field changes. Read the value only while the field is visible.
  - **Breaking:** validators, `onStepValidate` and lifecycle hooks receive the active projection in forms without routes too, without hidden fields and keys that are not field keys. Read other context from your own state.
  - **Breaking:** a field `key` used twice on one possible path makes the constructor throw instead of logging a warning. Rename one of the fields.
  - **Breaking:** React and Vue evaluate `submit.disabled` against `getSubmitValues()` instead of `engine.values`, and pass the same values as `values` to a custom actions component. Values of fields off the active path or on skipped steps no longer disable Submit.
- 03a5b5f: - `validateSubmission(definition, values, { validators })` runs the named validators you pass. Validators you do not pass are still skipped.
  - `validateSubmission()` reports an error under the `values` key when it receives the whole request body instead of the values.
  - **Breaking:** `engine.validate()`, Continue and Submit run the server type checks in the browser: `email` format with a top-level domain and at most 254 characters, `date` and `datetime` shape, a finite number for `number`, booleans for `checkbox` and `switch`, static option values, and at most 10,000 characters of text. Values that `validateSubmission()` rejects are now rejected before submit. Store valid values, or use a custom field type for other formats.
  - **Breaking:** `NaN`, `Infinity` and numeric strings in a `number` field fail with "Enter a number" instead of passing `min` and `max`. Write numbers with `setValue(key, Number(text))`.
  - **Breaking:** an empty field with `matchField` fails when the field it matches has a value. Make the confirmation field `required` as well if you also want "This field is required".
- 726b3fd: - `FormhausForm` offers "Submit another response" when the form allows it.
  - `FormhausForm` sends the render token and a honeypot field with each submission.
  - New `initialForm` prop on `FormhausForm` renders a form loaded on the server with `fetchForm()` from `@formhaus/core/cloud`, without a request in the browser.
  - New `draftStore` prop on `FormhausForm` keeps unsent answers. `sessionDraftStore()` from `@formhaus/core/cloud` stores them in `sessionStorage`, so they last until the tab closes and at most 7 days, without `password` and `file` fields.
  - New `fetchForm()` in `@formhaus/core/cloud` returns `{ definition, version, settings, renderToken }`.
  - `createSubmitter()` takes `renderToken` and an `extraBody()` callback.
  - A `426 client_outdated` answer fails with code `"client_outdated"` and "This form needs a newer version of this page."
  - **Breaking:** `@formhaus/core/cloud` loads forms from `GET /f/{id}/form?core=<version>` instead of `GET /f/{id}/definition`, and posts to `/f/{id}?core=<version>`. Allow the new path and query if a proxy or content security policy filters requests to `api.formhaus.dev`.
  - **Breaking:** `FormhausForm` shows the form's success message and opens its redirect URL after a submission instead of ignoring them. Pass `success` (React) or the `#success` slot (Vue) to keep your own success handling and skip the redirect.
- e8cdb54: - New condition operators `gt`, `gte`, `lt` and `lte` compare a number, or a numeric string such as a radio option value, with a number operand. Any other value does not match.
  - `checkDefinition()` reports a non-number operand as an error, and a comparison on a `checkbox`, `switch` or `multiselect` field as a warning.
- f1ccf3a: - New `checkDefinition(definition)` in `@formhaus/core` returns `DefinitionIssue[]`: `{ code, severity, path, message, hint }`, with a JSON pointer `path` and errors first.
  - New `parseDefinition(json)` returns the input typed as `FormDefinition`, or throws `FormDefinitionError`.
  - New `onWarning(issue)` option in `FormEngineOptions` receives definition warnings. Without it, warnings go to `console.warn` outside production.
  - New checks: missing `id`, `title` or `submit`; field types that look like typos of a built-in type; `select`, `radio` and `multiselect` without options; `defaultValue` outside `options`; `minLength` above `maxLength` and `min` above `max`; `min`/`max` or `minLength`/`maxLength` on a type they do not apply to; `matchField` and `optionsDependsOn` on unknown keys; conditions in `disabled`; condition values that can never match the field.
  - A route condition on a misspelled key reports an unknown field.
  - **Breaking:** `checkDefinition()` from `@formhaus/core/server` returns `DefinitionIssue[]` instead of `{ errors, warnings }`. Filter by `issue.severity === 'error'` for errors.
  - **Breaking:** the `FormEngine` constructor throws `FormDefinitionError` with `issues` instead of a plain `Error`. Read `error.issues` instead of splitting `error.message` by lines.
  - **Breaking:** a condition must have exactly one operator. `{ field }` without an operator and a condition with two operators make the constructor throw. Keep one of `eq`, `neq`, `in`, `notIn`, `notEmpty`.
  - **Breaking:** an unknown condition key, such as `equals`, makes the constructor throw instead of always matching. Rename it to a known operator.
  - **Breaking:** `evaluateCondition()` returns `false` for a condition without a known operator instead of `true`. Give every condition one operator.
  - **Breaking:** an invalid `pattern`, a show-condition cycle, `minLength` above `maxLength`, `min` above `max`, a missing `submit` and a condition without `field` make the constructor throw instead of logging a warning. Fix the reported path.
  - **Breaking:** a missing form `id`, step `id`, field `key` or field `type`, and a property of the wrong type, such as `in` that is not an array or `options` items that are not objects, make the constructor throw. Fix the reported path.
  - **Breaking:** `validateSubmission()` throws `FormDefinitionError` when the definition has an error. Run `checkDefinition()` before you store a definition.
  - **Breaking:** constructor warnings start with `[formhaus]` and a JSON pointer instead of `[FormEngine]`. Use `onWarning` to collect them.
  - `validateDefinition()` is deprecated and returns the messages of `checkDefinition()`. Use `checkDefinition(definition).filter((issue) => issue.severity === 'error')`. It is removed in 1.0.
  - The JSON Schema requires exactly one operator per condition.
- 31e96b6: - `FormEngine` takes an optional values type: `FormEngine<TValues>`. `values` and `getSubmitValues()` are typed `Partial<TValues>`.
  - **Breaking:** `engine.nextStep()` and `engine.nextStepAsync(reason)` are removed. Use `await engine.next()`, which runs `onStepValidate` and the step hooks and always reports `reason: 'next'`.
  - **Breaking:** `engine.prevStep()` and `engine.prevStepAsync()` are removed. Use `await engine.back()`, which runs the step hooks.
  - **Breaking:** `engine.skipStep()` and `engine.skipStepAsync(submit)` are removed. Use `await engine.skip(submit)`, which runs the step hooks.
  - **Breaking:** `engine.submitAsync(handler)` is renamed to `engine.submit(handler)`.
  - **Breaking:** `values`, `errors`, `topLevelErrors`, `currentStepIndex`, `fieldLoading`, `stepValidating` and `submitting` are read-only. Use `setValue()` instead of `engine.values.x = v`, and `setErrors()` instead of assigning `engine.errors`.
  - **Breaking:** `StepChangeContext.direction` is removed. Use `context.reason === 'back'`.
  - **Breaking:** the second argument of `SubmitFn`, `skippedSteps`, is a required `string[]`. Code that calls a `SubmitFn` or `onAfterSubmit` itself must pass the skipped step ids.
  - `onAfterSubmit(values, skippedSteps)` receives the skipped step ids as a second argument.
  - **Breaking:** the standalone `validateField(field, value, values, validators)` is renamed to `validateFieldValue()`. `engine.validateField(key)` is unchanged.
  - **Breaking:** `isStepVisible()` is removed. Use `isVisible(step, values)`.
  - **Breaking:** `getDefaultMessage(rule: string)` takes `rule: ValidationRule`: `'required'`, `'minLength'`, `'maxLength'`, `'min'`, `'max'`, `'pattern'` or `'matchField'`. Pass one of these values.
  - **Breaking:** `next()`, `back()` and `skip()` resolve to `false` while another action is pending, where the sync `nextStep()` and `prevStep()` moved at once. Call `cancelPendingActions()` first to interrupt a pending action.
- 6a04469: - New `@formhaus/core/internal` entry for renderer plumbing. It has no semver guarantee.
  - **Breaking:** `shouldApplyExternalErrors` is no longer exported from `@formhaus/core`. Import it from `@formhaus/core/internal`.
  - **Breaking:** `createCloudController`, `initialCloudState` and `focusProblem` are no longer exported from `@formhaus/core/cloud`. Import them from `@formhaus/core/internal`, or use `FormhausForm` from `@formhaus/react/cloud` or `@formhaus/vue/cloud`.
  - **Breaking:** the `CloudCallbacks` and `CloudState` types moved from `@formhaus/core/cloud` to `@formhaus/core/internal`. Import them from there.
  - **Breaking:** the `form_abandoned` event is removed from `FormAnalyticsEvent`. It was never emitted. Remove handlers for it.
- a1eb753: - The React main entry starts with `'use client'`, so React Server Components treat it as a client boundary.
  - **Breaking:** `@formhaus/core` is a peer dependency of `@formhaus/react` and `@formhaus/vue` instead of a dependency. Install it next to the adapter: `npm i @formhaus/core @formhaus/react` or `npm i @formhaus/core @formhaus/vue`.
  - **Breaking:** the React peer range is `^18.0.0 || ^19.0.0` instead of `>=18.0.0`. Use React 18 or 19.
  - **Breaking:** the Vue peer range is `^3.3.3` instead of `>=3.3.0`. Upgrade Vue 3.3.0 to 3.3.2 to 3.3.3 or later.
  - **Breaking:** minimum Node is 20 for `@formhaus/core`, `@formhaus/react` and `@formhaus/vue`. Node 18 is end of life.
- 0ba2078: - React and Vue export all 11 built-in fields (`TextField`, `TextareaField`, `SelectField`, `AutocompleteField`, `MultiselectField`, `CheckboxField`, `RadioField`, `SwitchField`, `FileField`, `DateField`, `DateTimeField`) and `defaultFieldComponents`.
  - React and Vue export `FormhausField`, which renders one field with the built-in fields as fallbacks.
  - New `headingLevel` prop on `FormRenderer` and `HeadlessFormRenderer` sets the step title heading, `1` to `6`.
  - **Breaking:** the step title renders as `<h2>` instead of `<h3>`. Pass `headingLevel={3}` (React) or `:heading-level="3"` (Vue) to keep `<h3>`.
  - **Breaking:** React `ActionsComponent` and `ProgressComponent` props are renamed to `actionsComponent` and `progressComponent`. Rename the props.
  - **Breaking:** React `onStepChange(stepId, direction)` is removed. Use `onAfterStepChange(context)` and read `context.toStepId` and `context.reason`.
  - React `onSubmit` is typed `SubmitFn`: `(values, skippedSteps: string[]) => void | Promise<void>`.
  - **Breaking:** Vue `@submit` is the submit handler instead of a notification after `submitHandler`: it is awaited and receives `(values, skippedSteps)`. Move the saving code from `:submit-handler="save"` to `@submit="save"`, and move code that reacted to the old `@submit` notification to `:on-after-submit`. When both are passed, `@submit` wins and `submitHandler` is ignored. `submitHandler` is deprecated and removed in 1.0.
  - **Breaking:** Vue `stepChange` event is removed. Use the `onAfterStepChange` prop and read `context.toStepId` and `context.reason`.
  - **Breaking:** Vue custom fields receive `modelValue` instead of `value` and emit `update:modelValue` instead of `update:value`, so `v-model` works. Rename the prop and the event in custom field components.
  - **Breaking:** Vue `FormField` component is renamed to `FormhausField`. Import `FormhausField` instead.
  - **Breaking:** Vue `FieldComponentMap` is `Partial<Record<FieldType, Component>>` instead of `Record<FieldType, Component>`.
  - **Breaking:** Vue `FormActions` no longer declares the `action` event. Remove `@action` listeners.
  - **Breaking:** `FormAction.action` is removed from the type and the JSON Schema, so a definition with `action` fails schema validation. Remove `action` from definitions.
  - **Breaking:** React and Vue create a new engine when the `definition` object changes, not only when `definition.id` changes. Pass a stable object, such as a module constant or a memoized value, to keep answers across renders.
- 7fcb7a3: - A field that becomes hidden loses its validation error even when it has no value.
  - A skip that changes the active path removes the errors of fields that leave it.
  - **Breaking:** `engine.skip()` returns `false` on a step without a `skip` action instead of skipping it. Add `skip: { label }` to the step, or call `next()`.

## 0.10.1

### Patch Changes

- 8630259: - A paused form loaded from `@formhaus/core/cloud` fails with code `"paused"` and "This form is paused." instead of "Could not send. Try again."
  - Cloud requests time out after 15 seconds for the definition and 30 seconds for a submission. The `CloudError` has `status` `0`, code `"timeout"` and the `"retry"` action.
  - The network failure message is "Could not reach the form server. Check your connection and try again." instead of "You are offline".
  - A response body that is not JSON fails with a `CloudError` with code `"invalid_response"` instead of a `SyntaxError`.
  - `start()` of `createCloudController()` loads the definition again after a load error.
- 8630259: - `validateDefinition()` and `checkDefinition()` from `@formhaus/core/server` return messages for malformed input instead of throwing. This covers `null`, `fields` or `steps` that are not arrays, a step without `fields`, and `show`, `showAny` or `routes` that are not arrays.
  - The `FormEngine` constructor throws an `Error` that names the malformed part instead of a `TypeError`.
  - `validateDefinition()` reports a missing `submit` action and a condition without a `field` name.
  - `FormDefinition` accepts `$schema`.
  - `validateSubmission()` no longer logs definition warnings with `console.warn`.
- 0414183: - `inputMode` accepts `decimal`, `url` and `search`.
- a15c07f: Fixed fields below a radio or multiselect group jumping when an input gets focus in Safari.
- 26eb04c: - A submit that fails on a field of an earlier step moves the form to that step.
- 4d656df: - On touch screens the stylesheet uses 17px text and 15px helper and error text. Inputs stay at 16px or more, so iOS Safari does not zoom in on focus.
  - The whole checkbox and switch row toggles the control. On touch screens the row is at least 44px tall.

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
