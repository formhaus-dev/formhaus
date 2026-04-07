# Changelog

## Unreleased

### `@formhaus/core`

- `FieldType` now accepts any string. Built-in types get autocomplete via `DefaultFieldType`.
- `multiselect` validation: empty arrays are empty, `minLength`/`maxLength` check selection count.
- `setErrors()` now replaces all previous errors instead of merging.
- `validateSchema()` detects duplicate field keys and invalid regex patterns.
- Cascade clearing now respects step-level visibility.

### `@formhaus/react`

- **Breaking:** CSS class `fh-form-actions__btn` renamed to `fh-form-actions__button`.
- **Breaking:** CheckboxField, RadioField, SwitchField structure and class names aligned with Vue.
- New `MultiselectField` component (checkbox group).
- `optionsProviders` prop for dynamic field options via `optionsFrom`.
- `onAnalyticsEvent` prop fires on focus, blur, error, step change, and submit.
- `FieldComponentProps` now includes `onFocus`.
- Submit button evaluates `FormAction.disabled` conditions.
- `mask` field shown as placeholder fallback in TextField.
- `useFormEngine` recreates engine when `schema.id` changes.

### `@formhaus/vue`

- **Breaking:** All scoped styles removed. Components are now unstyled by default.
- New `MultiselectField` component (checkbox group).
- `optionsProviders` prop wired up for dynamic field options.
- `analyticsEvent` emit fires on focus, blur, error, step change, and submit.
- Field components now emit `focus`.
- `useFormEngine` accepts getter, recreates engine when `schema.id` changes.
- Submit button evaluates `FormAction.disabled` conditions.
- `mask` field shown as placeholder fallback in TextField.
- Removed unused `actions` prop from FormRenderer.

## 0.2.1 - 2026-04-07

### `@formhaus/react`

- `FormActionsProps` now includes optional `primaryLabel`, `showBack`, `backLabel`, `onPrimary`. Custom `ActionsComponent` can use these instead of re-deriving step-navigation logic from raw props.
- `FormStep.next.label` is now respected as the "Continue" button label on intermediate steps. Previously hardcoded to "Continue".

### `@formhaus/vue`

- `FormActionsProps` now includes optional `primaryLabel`, `showBack`, `backLabel`. Custom `actionsComponent` can use these instead of re-deriving step-navigation logic.
- New `primary` emit for unified primary button handling.
- `FormStep.next.label` is now respected as the "Continue" button label on intermediate steps. Previously hardcoded to "Continue".

## 0.2.0 - 2026-04-07

### `@formhaus/react`

- `ActionsComponent` prop on `FormRenderer` to replace the default form buttons.
- `ProgressComponent` prop on `FormRenderer` to replace the default step progress bar.
- Exported `FormActionsProps` and `FormStepProgressProps` types.

### `@formhaus/vue`

- `actionsComponent` prop on `FormRenderer` to replace the default form buttons.
- `progressComponent` prop on `FormRenderer` to replace the default step progress bar.
- Exported `FormActionsProps` and `FormStepProgressProps` types.

## 0.1.2 - 2026-04-07

### `@formhaus/vue`

- Fixed missing `.d.ts` files in published dist.

## 0.1.0 - 2026-04-07

### `@formhaus/core`

- Form engine, types, validation, visibility, conditional fields.

### `@formhaus/react`

- React adapter with native HTML field components.

### `@formhaus/vue`

- Vue 3 adapter with native HTML field components.

### `@formhaus/figma`

- Figma plugin with configurable component map.
