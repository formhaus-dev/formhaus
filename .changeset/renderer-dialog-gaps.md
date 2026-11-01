---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- The rendered `<form>` has `noValidate`, so browser validation bubbles no longer replace the field messages.
- React `FormRenderer` and `HeadlessFormRenderer` pass `style`, `aria-*` and `data-*` props to the `<form>`.
- New `useSubmitState` in `@formhaus/react` and `@formhaus/vue` returns `submitting`, `validating` and `canSubmit` for buttons outside the form. It takes an engine or a handle, or returns a `ref` for the renderer.
- New `formErrorsPlacement` prop: `"top"` renders form errors above the fields.
- The React renderer handle keeps one identity for each engine. Storing it in state no longer re-renders in a loop.
- React `useFormDirty` also takes a renderer handle.
- The functions on `useFormDirty`, `trackDirty` and `schemaParse` results are typed as properties, so passing them unbound passes `@typescript-eslint/unbound-method`.
- An `unknown-property` warning for a format 1.8 property below format 1.8 names the format version it needs.
