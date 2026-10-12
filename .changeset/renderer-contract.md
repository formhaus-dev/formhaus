---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- React and Vue export all 11 built-in fields (`TextField`, `TextareaField`, `SelectField`, `AutocompleteField`, `MultiselectField`, `CheckboxField`, `RadioField`, `SwitchField`, `FileField`, `DateField`, `DateTimeField`) and `defaultFieldComponents`.
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
