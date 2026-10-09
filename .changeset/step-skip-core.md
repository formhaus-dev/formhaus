---
"@formhaus/core": minor
---

- New `skip` step option. A skipped step is left out of submit validation and submitted values.
- New `skipStep()` and `skipStepAsync()` reset the current step to its defaults and move forward without validation.
- `skipStepAsync(submit)` submits without the step when no step follows it. Without `submit` it returns `false` and changes nothing.
- New `isStepSkipped()` method.
- Pressing Next or Submit on a skipped step, or changing one of its fields, includes it again.
- `StepChangeContext.reason` can be `'skip'`.
- New `step_skipped` analytics event type.
- `validateDefinition()` warns about `skip` on a single-step form or a step with `next: false`.
