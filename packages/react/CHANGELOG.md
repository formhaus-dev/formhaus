# @formhaus/react

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
