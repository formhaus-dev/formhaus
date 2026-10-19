---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- The `stepErrorMarks` step list shows a numbered marker before each step name. Steps before the current one show a check, the current step a filled marker, and steps with errors an alert icon.
- A step with errors shows its error count in a badge. Screen readers announce the `stepErrors` label instead of the bare number.
- A step progress narrower than 400px shows only the markers and error counts. Step names stay available to screen readers.
- Each step renders its name in `.fh-step-progress__name` and its error count in `.fh-step-progress__errors`. The ` · ` separator and the `<strong>` around the current step are gone.
- Step markers use `--fh-color-border`, `--fh-color-primary`, `--fh-color-primary-soft`, `--fh-color-error` and `--fh-color-error-soft`. The name of a step with errors uses `--fh-color-text` instead of `--fh-color-error`.
