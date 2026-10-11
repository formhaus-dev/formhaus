# @formhaus/vue

## 0.10.0

### Minor Changes

- 113cbc7: - `submitHandler` receives the ids of skipped steps as a second argument.
  - New `FormhausForm` in `@formhaus/vue/cloud`. It loads a published definition by `id`, renders it and posts submissions, with a `success` event, an `onError` prop and `fallback` and `success` slots. 422 responses map onto fields.
- 70690ac: - **Breaking:** `onError` in `FormhausForm` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
  - `FormhausForm` shows every failed submission in a notice above the form, with "Try again" for 429, 5xx and network failures. The notice takes focus. Entered values stay.
  - `FormhausForm` focuses the first field with a server error when there is no notice. Messages for keys the form does not render are listed in the notice.
  - `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, marks dropped answers with "Please answer again." and asks to review and submit again.
  - `FormhausForm` now renders the form inside a `div.fh-cloud` wrapper.
  - `CloudError.message` texts changed. `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`.
  - `createSubmitter()` takes an optional `version` next to `id` and `apiBase`.
  - New `.fh-form__notice` styles in `@formhaus/core/style.css`.
- 2e9e7c1: - **Breaking:** `helperText` renders under the label, above the control. For checkbox and switch it renders under the row. Errors stay below the control.
  - Helper text stays visible while the field shows an error. The error has its own id, `fh-field-<key>-error`, and `aria-describedby` lists both.
  - Field errors have `role="alert"`, as in React.
  - `layout: "inline"` adds the `fh-field__radio-group--inline` or `fh-field__multiselect-group--inline` class.
  - Select and textarea get the `fh-field__input--select` and `fh-field__input--textarea` classes, as in React.

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

- 2bd4c47: - `FormActions` renders a Skip button on steps with `skip` and emits `skip`. New `skipAction`, `showSkip` and `skipLabel` props.
  - **Breaking:** Back renders with `fh-form-actions__button--secondary`. It was `--text`, or `--primary` when `back` was an object without `variant`.
  - **Breaking:** Cancel without `variant` renders with `fh-form-actions__button--text` instead of `--primary`.
  - Back, Skip and Cancel use `variant` from their action when it is set.
  - **Breaking:** `FormActions` without `showPrimary` or `showBack` derives them from the step like the React adapter. Previously both buttons were hidden.
  - `analyticsEvent` emits `step_skipped` instead of `step_completed` for a skipped step, including Skip on the last step.

### Patch Changes

- Updated dependencies [75e49f2]
- Updated dependencies [2bd4c47]
  - @formhaus/core@0.8.0

## 0.7.2

### Patch Changes

- ccd6e34: - A failed navigation or submit error clears when the user retries or the definition changes, instead of staying on the next step.
  - A failed action no longer replaces field or external errors. Its message shows next to the form-level errors and is not added to `engine.topLevelErrors`.
- 2e2d39b: - Double-clicking an `autoAdvance` radio answers only the current question. The second click no longer selects an option on the next step.
- 7162b69: - Checkbox, switch, select and file fields emit `blur`, so `field_blurred` analytics events fire for them.
- Updated dependencies
  - @formhaus/core@0.7.2

## 0.7.1

### Patch Changes

- 4371c19: - An `errors` prop with unchanged contents no longer clears validation errors on re-render.
  - An `errors` prop is re-applied when it repeats an error the user has since cleared.
- 4371c19: - The `errors` prop is applied on first render and after the definition changes.
- Updated dependencies [4371c19]
  - @formhaus/core@0.7.1

## 0.7.0

### Minor Changes

- - New `onBeforeStepChange`, `onAfterStepChange`, `onBeforeSubmit`, `onAfterSubmit` and `onError` props.
  - New `submitHandler` prop is awaited before `submit` is emitted. Inputs stay disabled and repeated submits are ignored until it settles.
  - Radio fields with `autoAdvance` go to the next step on click, Space or Enter. Arrow keys only select.
  - Custom fields emit `commit`. Custom actions receive `showPrimary`.
  - Focus moves to the first field of the new step after navigation.
  - Pressing Enter inside the form runs the primary action.

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

### Patch Changes

- 76b2a0d: - Clearing a number input preserves an empty value instead of submitting `0`.
- 76b2a0d: - Dynamic option providers update when their declared dependencies change.
  - Older provider responses no longer overwrite newer options.
- Updated dependencies [76b2a0d]
- Updated dependencies [76b2a0d]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
- Updated dependencies [ad80814]
  - @formhaus/core@0.5.0

## 0.4.0 - 2026-05-10

### Minor

- New `AutocompleteField` for `type: 'autocomplete'`. Renders `<input>` + `<datalist>` — native browser filtering, SSR-safe. For richer pickers (Vuetify `<v-autocomplete>`, Element Plus `<el-autocomplete>`) plug in your own component via `components`.
- New `DateTimeField` for `type: 'datetime'`. Renders `<input type="datetime-local">`.

### Patch

- Source maps now ship alongside the minified bundle.

### Peer

- Bumped `@formhaus/core` to `^0.4.0`.
