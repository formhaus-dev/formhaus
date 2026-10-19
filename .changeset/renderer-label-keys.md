---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New labels `clear` (`Clear`), `chooseFile` (`Choose file`), `required` (`required`), `skip` (`Skip`), `submit` (`Submit`), `stepTitle` (`Step {index}`) and `stepErrors` (`Errors: {count}`).
- The Skip button uses the `skip` label when the step `skip` action has no label.
- The final Submit button uses the `submit` label when the `submit` action has no label.
- The step progress names a step without a title with `stepTitle`.
- **Behavior change:** the step progress marks a step with errors as `· Errors: 2` instead of `· 2 errors`. Change it with the `stepErrors` label.
- `FormActions` and `FormStepProgress` use the renderer `labels` and `definition.labels` for their fallback texts.
- `clear`, `chooseFile` and `required` are for native renderers. The web renderers do not show them.
- `textSlots()` and `translationTemplate()` list each new label only when the form uses it.
- `translationIssues()` reports these labels as missing from existing translations of forms that use them.
- A custom actions component receives `skipLabel`.
