---
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `layout` prop on `FormRenderer`, `HeadlessFormRenderer` and `FormhausForm` with the keys `fields`, `section`, `group`, `groupItem`, `confirmDialog`, `errorSummary`, `formErrors`, `progress` and `actions`.
- `components.section`, `components.group`, `components.groupItem`, `components.confirmDialog`, `actionsComponent` and `progressComponent` keep working until 2.0. `layout` wins when both are set. In development each old key warns once with `legacy-layout`.
- The `fields`, `errorSummary`, `formErrors`, `progress` and `actions` slots get `rootProps` to spread on their root element.
- The built-in fields container, error summary, form errors, step progress and actions carry `data-fh` attributes.
- Focus after a failed Continue or Submit finds the fields and the error summary by `data-fh`, so a custom error summary gets focus when there are several errors.
- Without a fields container, focus skips the progress, actions and error summary.
- `layout.confirmDialog` stays mounted with its group and follows `open`. `components.confirmDialog` still mounts only while a removal waits.
- A `layout.progress` component always gets `steps`, and the new `marks` prop is `true` with `stepErrorMarks`. The built-in progress draws the step list only when `marks` is `true`.
- Components passed through `actionsComponent` and `progressComponent` get the same props as before.
- A field in a matrix section gets `matrix` with the columns and its row index.
- `layout.actions` of `FormhausForm` gets the notice like `actionsComponent`.
- New types `LayoutComponentMap`, `FieldsContainerProps`, `ErrorSummaryComponentProps`, `FormErrorsComponentProps` and `RootProps`.
- Requires `@formhaus/core` 1.3.0.
