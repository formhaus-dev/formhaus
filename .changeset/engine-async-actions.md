---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `FormEngine` takes an optional values type: `FormEngine<TValues>`. `values` and `getSubmitValues()` are typed `Partial<TValues>`.
- **Breaking:** `engine.nextStep()` and `engine.nextStepAsync()` are removed. Use `await engine.next()`, which runs `onStepValidate` and the step hooks.
- **Breaking:** `engine.prevStep()` and `engine.prevStepAsync()` are removed. Use `await engine.back()`, which runs the step hooks.
- **Breaking:** `engine.skipStep()` and `engine.skipStepAsync(submit)` are removed. Use `await engine.skip(submit)`, which runs the step hooks.
- **Breaking:** `engine.submitAsync(handler)` is renamed to `engine.submit(handler)`.
- **Breaking:** `values`, `errors`, `topLevelErrors`, `currentStepIndex`, `fieldLoading`, `stepValidating` and `submitting` are read-only. Use `setValue()` instead of `engine.values.x = v`, and `setErrors()` instead of assigning `engine.errors`.
- **Breaking:** `StepChangeContext.direction` is removed. Use `context.reason === 'back'`.
- **Breaking:** the second argument of `SubmitFn`, `skippedSteps`, is a required `string[]`. A submit handler typed `(values, skippedSteps?: string[])` still compiles.
- **Breaking:** `onAfterSubmit(values, skippedSteps)` receives the skipped step ids as a second argument.
- **Breaking:** the standalone `validateField(field, value, values, validators)` is renamed to `validateFieldValue()`. `engine.validateField(key)` is unchanged.
- **Breaking:** `isStepVisible()` is removed. Use `isVisible(step, values)`.
- **Breaking:** `getDefaultMessage(rule)` takes a `ValidationRule`: `'required'`, `'minLength'`, `'maxLength'`, `'min'`, `'max'`, `'pattern'` or `'matchField'`.
