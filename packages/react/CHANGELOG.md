# @formhaus/react

## 0.16.0

### Minor Changes

- New `onValuesChange` prop fires on mount and on every value change.
- Requires `@formhaus/core` 0.16.0.

## 0.15.0

### Minor Changes

- **Breaking:** A cleared number input writes `null` instead of an empty string.
- `FormRenderer` and `HeadlessFormRenderer` take a ref that exposes `setValue(key, value)` and `getValues()`. The type is `FormRendererHandle`.
- `setValue` from the ref does not call `onFieldChange`.
- Group Add and Remove call `onFieldChange` with the group key and the new items.
- `FormhausForm` saves a draft after group Add and Remove.
- Focus after group Add and Remove finds custom item and Add elements marked with `data-fh-group-item` and `data-fh-group-add`.
- Add focuses the new item's title when the item has no field to focus.
- An error summary link to a group count error focuses a custom Add marked with `data-fh-group-add`.
- Warns in development when a form gets a new `definition` object with the same content, which resets the form. The warning goes to `onWarning` with the code `definition-reset`.
- Warns in development once per field type that has no component in `components`. The warning lists the registered types and goes to `onWarning` with the code `missing-component`.
- The "Unsupported field type" placeholder names the type only in development.
- The "Unsupported field type" placeholder has the `fh-field--unsupported` class.

### Patch Changes

- Requires `@formhaus/core` 0.15.0.

## 0.14.2

### Patch Changes

- Fixed `FormhausForm` with `initialForm` showing empty fields instead of the saved draft.
- Requires `@formhaus/core` 0.14.2.

## 0.14.1

### Patch Changes

- Fixed a field inside a group showing the options that `optionsProviders` loaded for a field with the same key in another group, even when the field lists its own options.
- Fixed `FieldComponentMap` entries such as `text: ({ value, onChange }) => …` failing strict type checks with implicit `any` props.
- `FieldComponentMap` types the props of `section`, `group`, `groupItem` and `confirmDialog` entries.
- Fixed fields in one group item getting the same DOM id when their keys differ only in punctuation, such as `contact.email` and `contact-email`. The second error summary link focused the first field.
- Fixed a section and a field getting the same DOM id when their keys differ only in punctuation.
- Requires `@formhaus/core` 0.14.1.

## 0.14.0

### Minor Changes

- `FormRenderer` fills `hidden` fields from their `source` after mount. Initial values win, `defaultValue` is the fallback, and `onFieldChange` is not called.
- `FormhausForm` and `@formhaus/core/cloud` load and submit forms through api.formhaus.cc by default. Add it to your CSP `connect-src` if you use an allowlist; api.formhaus.dev keeps working.
- Renders sections as a `fieldset` with a `legend` and repeatable groups with Add and Remove buttons and numbered item titles.
- Adding an item focuses its first field. Removing one focuses the next item title, or Add when no item follows. A polite live region announces both.
- The error summary links to item fields, and a group count error focuses its Add button.
- New `section`, `group`, `groupItem` and `confirmDialog` entries in `components` replace the markup of sections, groups, item cards and the remove dialog. `DefaultSection`, `DefaultGroup`, `DefaultGroupItem` and `DefaultConfirmDialog` are exported.
- Removing a group item with answers asks first in a modal dialog. Turn it off with `confirmRemove: false`.
- New `TimeField` renders `time` fields as `<input type="time">`.
- New `HiddenField` renders `hidden` fields as `<input type="hidden">`, without a label or a focusable control.
- The error summary leaves out `hidden` fields. Their errors show with the form-level errors.

### Patch Changes

- CommonJS code can `require()` the packages on Node 20.19+ and 22.12+. Before, `require()` failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Requires `@formhaus/core` 0.14.0.

## 0.13.2

### Patch Changes

- 6dfb643: - Fixed two fields sharing one element id when their keys differ only in characters other than letters, digits, `_` and `-`, such as `contact.email` and `contact-email`. Labels, error messages and error summary links pointed at the first field. Ids of keys without such a collision are unchanged.
- 5dfddfe: - Fixed a field keeping provider options after its provider was removed from `optionsProviders`. The field shows its own `options` again.
- Updated dependencies [5752683]
  - @formhaus/core@0.13.2

## 0.13.1

### Patch Changes

- 1a4874a: - Fixed error summary links not focusing the field on single-step forms.
  - Fixed `stepErrorMarks` showing an error on a step with the id `constructor`.
  - A change of the `errors` prop now focuses the first invalid field when focus is inside the form and not in a text field.
- fc1078f: - Fixed an error summary link to a field on another step sometimes leaving focus on the page body.
- Updated dependencies [a5c775e]
- Updated dependencies [49485c8]
- Updated dependencies [1a4874a]
- Updated dependencies [5ea6229]
  - @formhaus/core@0.13.1

## 0.13.0

### Minor Changes

- fe4a968: - New `messages` prop for validation messages, an object of templates or a function.
  - New `labels` prop for the Continue and Back buttons, the step counter and the error summary title, an object of templates or a function.
  - The `<form>` element gets `lang` from the definition.
  - Custom progress components receive the step counter text as `counterLabel`.
  - New `@formhaus/react/i18n` entry with `useLocalizedForm()`, which returns the props of a form in one language.
  - `useLocalizedForm()` recreates the form when the language changes, which clears entered values.
  - Requires `@formhaus/core` 0.13.

### Patch Changes

- Updated dependencies [fe4a968]
  - @formhaus/core@0.13.0

## 0.12.0

### Minor Changes

- 9298412: - The submit handler can return `{ ok: true }` or `{ ok: false, errors, formErrors }`. A rejection keeps the answers, shows the errors and does not run `onAfterSubmit`. Handlers that return nothing, or anything other than a plain object with `ok: false`, work as before.
  - New `SubmitResult` and `SubmitHandler` types. The renderers' `onSubmit` prop is typed `SubmitHandler`, which accepts every `SubmitFn`.
  - Server errors from a rejection or `setErrors()` stay through step navigation and validation of other fields. Editing a field removes only that field's error.
  - `setErrors()` and a rejection open the earliest step with an error, whatever the key order.
  - A successful submission clears server errors and form-level errors.
  - `onStepValidate` errors no longer remove server errors on other steps.
  - A submit response that arrives after `reset()`, `cancelPendingActions()` or an unmount is ignored. Errors for fields edited during the request are dropped.
  - New `engine.stepErrors` lists the fields with errors by step.
  - New `errorSummary` renderer prop lists every field error with a link that opens its step and focuses the field.
  - New `stepErrorMarks` renderer prop lists the steps under the progress bar and marks the steps with errors. Custom progress components receive the list as `steps`.
  - The form-level error banner has `role="alert"`.
  - The renderers focus the first invalid field after a failed Continue.

### Patch Changes

- Updated dependencies [9298412]
  - @formhaus/core@0.12.0

## 0.11.3

### Patch Changes

- Updated dependencies [5daae4d]
  - @formhaus/core@0.11.3

## 0.11.2

### Patch Changes

- 434db0c: - Continue is disabled while the `disabled` conditions of the step `next` action match. Enter does not advance the step either.
  - Custom actions components receive the `next` action of the current step as `nextAction`.
- Updated dependencies [434db0c]
- Updated dependencies [4fb22ad]
- Updated dependencies [960d281]
- Updated dependencies [97441bb]
  - @formhaus/core@0.11.2

## 0.11.1

### Patch Changes

- `FormhausForm` keeps the response when it is sent again right after a "form updated" notice.
- A required select without `placeholder` starts empty, so its first option can be picked.
- Updated dependencies [2d103ac]
  - @formhaus/core@0.11.1

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
- 726b3fd: - `FormhausForm` offers "Submit another response" when the form allows it.
  - `FormhausForm` sends the render token and a honeypot field with each submission.
  - New `initialForm` prop on `FormhausForm` renders a form loaded on the server with `fetchForm()` from `@formhaus/core/cloud`, without a request in the browser.
  - New `draftStore` prop on `FormhausForm` keeps unsent answers. `sessionDraftStore()` from `@formhaus/core/cloud` stores them in `sessionStorage`, so they last until the tab closes and at most 7 days, without `password` and `file` fields.
  - New `fetchForm()` in `@formhaus/core/cloud` returns `{ definition, version, settings, renderToken }`.
  - `createSubmitter()` takes `renderToken` and an `extraBody()` callback.
  - A `426 client_outdated` answer fails with code `"client_outdated"` and "This form needs a newer version of this page."
  - **Breaking:** `@formhaus/core/cloud` loads forms from `GET /f/{id}/form?core=<version>` instead of `GET /f/{id}/definition`, and posts to `/f/{id}?core=<version>`. Allow the new path and query if a proxy or content security policy filters requests to `api.formhaus.dev`.
  - **Breaking:** `FormhausForm` shows the form's success message and opens its redirect URL after a submission instead of ignoring them. Pass `success` (React) or the `#success` slot (Vue) to keep your own success handling and skip the redirect.
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
- bb1d951: - Built-in inputs have `name` set to the field key.
  - Custom field components receive an `id` prop. Put it on the control so the label and error messages stay linked.
  - **Breaking:** field ids are unique per form instance: `<form id>-<key>`, with characters other than letters, digits, `_` and `-` in the key replaced by `-`. React used `id="email"` and Vue `id="fh-field-email"`. Select inputs by `name` or by label instead of `#email`.
  - **Breaking:** radio and multiselect option ids are `<field id>-<index>` instead of `<key>-<value>`. Select options by label.
  - **Breaking:** helper and error ids follow the field id: `<field id>-helper` and `<field id>-error`.

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

## 0.10.1

### Patch Changes

- 8630259: - `FormhausForm` shows "Try again" when the definition fails to load on a network failure, a timeout, a response that is not JSON, `429` or `5xx`.
- 26eb04c: - Enter in a single-line input runs Continue or Submit. The primary button is now `type="submit"`.
  - After a failed Continue or Submit, focus moves to the first invalid field.
  - Required inputs have `aria-required="true"`.
- 0414183: - Number fields keep decimals, trailing zeros and the minus sign while typing. Typing `1.05` no longer gives `15`.
  - Text fields render the `inputMode` attribute.
- Updated dependencies [8630259]
- Updated dependencies [8630259]
- Updated dependencies [0414183]
- Updated dependencies [a15c07f]
- Updated dependencies [26eb04c]
- Updated dependencies [4d656df]
  - @formhaus/core@0.10.1

## 0.10.0

### Minor Changes

- 113cbc7: - `onSubmit` receives the ids of skipped steps as a second argument.
  - New `FormhausForm` in `@formhaus/react/cloud`. It loads a published definition by `id`, renders it and posts submissions, with `onSuccess`, `onError`, `fallback` and `success` props. 422 responses map onto fields.
- 70690ac: - **Breaking:** `onError` in `FormhausForm` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
  - `FormhausForm` shows every failed submission in a notice above the form, with "Try again" for 429, 5xx and network failures. The notice takes focus. Entered values stay.
  - `FormhausForm` focuses the first field with a server error when there is no notice. Messages for keys the form does not render are listed in the notice.
  - `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, marks dropped answers with "Please answer again." and asks to review and submit again.
  - `FormhausForm` now renders the form inside a `div.fh-cloud` wrapper.
  - `CloudError.message` texts changed. `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`.
  - `createSubmitter()` takes an optional `version` next to `id` and `apiBase`.
  - New `.fh-form__notice` styles in `@formhaus/core/style.css`.
- 2e9e7c1: - **Breaking:** `helperText` renders under the label, above the control. For checkbox and switch it renders under the row. Errors stay below the control.
  - Helper text stays visible while the field shows an error. `aria-describedby` lists both.
  - `layout: "inline"` adds the `fh-field__radio-group--inline` or `fh-field__multiselect-group--inline` class.

### Patch Changes

- Updated dependencies [113cbc7]
- Updated dependencies [70690ac]
- Updated dependencies [6654e27]
- Updated dependencies [a479c16]
- Updated dependencies [2e9e7c1]
- Updated dependencies [3f5bfee]
  - @formhaus/core@0.10.0

## 0.9.0

No changes. Version aligned with `@formhaus/core` 0.9.0.

## 0.8.0

### Minor Changes

- 2bd4c47: - `FormActions` renders a Skip button on steps with `skip`. New `skipAction`, `showSkip`, `skipLabel` and `onSkip` props.
  - **Breaking:** Back renders with `fh-form-actions__button--secondary` instead of `--text`.
  - Back, Skip and Cancel use `variant` from their action when it is set.
  - `onAnalyticsEvent` receives `step_skipped` instead of `step_completed` for a skipped step, including Skip on the last step.

### Patch Changes

- Updated dependencies [75e49f2]
- Updated dependencies [2bd4c47]
  - @formhaus/core@0.8.0

## 0.7.2

### Patch Changes

- ccd6e34: - A failed navigation or submit error clears when the user retries or the definition changes, instead of staying on the next step.
  - A failed action no longer replaces field or external errors. Its message shows next to the form-level errors and is not added to `engine.topLevelErrors`.
- 2e2d39b: - Double-clicking an `autoAdvance` radio answers only the current question. The second click no longer selects an option on the next step.
- Updated dependencies
  - @formhaus/core@0.7.2

## 0.7.1

### Patch Changes

- 4371c19: - An `errors` prop with unchanged contents no longer clears validation errors on re-render.
  - An `errors` prop is re-applied when it repeats an error the user has since cleared.
- Updated dependencies [4371c19]
  - @formhaus/core@0.7.1

## 0.7.0

### Minor Changes

- - New `onBeforeStepChange`, `onAfterStepChange`, `onBeforeSubmit`, `onAfterSubmit` and `onError` props.
  - `onSubmit` is awaited. Inputs stay disabled and repeated submits are ignored until it settles.
  - Radio fields with `autoAdvance` go to the next step on click, Space or Enter. Arrow keys only select.
  - Custom fields receive `onCommit`. Custom actions receive `showPrimary`.
  - Focus moves to the first field of the new step after navigation.

### Patch Changes

- Updated dependencies
  - @formhaus/core@0.7.0

## 0.6.0

### Minor Changes

- ddcb5da: New `HeadlessFormRenderer` renders only the components you pass, so the built-in native fields stay out of your bundle.

### Patch Changes

- Updated dependencies [ddcb5da]
  - @formhaus/core@0.6.0

## 0.5.0

### Minor Changes

- 76b2a0d: - Exposes the `OptionsProvider` type.

### Patch Changes

- 76b2a0d: - Clearing a number input preserves an empty value instead of submitting `0`.
- ad80814: - Changing one field no longer rerenders unchanged field components.
  - Dynamic options no longer rerender their field when the returned options are unchanged.
- Updated dependencies [76b2a0d]
- Updated dependencies [76b2a0d]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
  - @formhaus/core@0.5.0

## 0.4.0 - 2026-05-10

### Minor

- New `AutocompleteField` for `type: 'autocomplete'`. Renders `<input>` + `<datalist>` — native browser filtering, SSR-safe. For richer pickers (MUI `Autocomplete`, Headless UI `Combobox`) plug in your own component via `components`.
- New `DateTimeField` for `type: 'datetime'`. Renders `<input type="datetime-local">`.

### Patch

- Fixed `FormRenderer` crashing under React SSR (Next.js prerender, `renderToString`) with "Missing getServerSnapshot". `useFormEngine` now provides a server snapshot and stable subscribe/getSnapshot callbacks. Apps that wrapped `FormRenderer` in `next/dynamic({ ssr: false })` to avoid the crash can drop the wrapper and recover prerendering.
- Source maps now ship alongside the minified bundle.

### Peer

- Bumped `@formhaus/core` to `^0.4.0`.
