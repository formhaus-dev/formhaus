# Changelog

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
