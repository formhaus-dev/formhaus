---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- The `stepErrorMarks` step list shows a numbered marker before each step name. Steps before the current one show a check, the current step a filled marker, and steps with errors a red marker.
- A step with errors shows an alert icon and its error count in a badge. Screen readers announce the `stepErrors` label instead of the bare number.
- The progress bar is hidden while the step list is shown. `Step N of M` stays above the list.
- A step progress narrower than 400px shows only the markers and an alert badge for steps with errors. Step names and error counts stay available to screen readers.
- Each step renders its name in `.fh-step-progress__name` and its error count in `.fh-step-progress__errors`. The ` · ` separator and the `<strong>` around the current step are gone.
- Step markers use `--fh-color-control-hover`, `--fh-color-primary`, `--fh-color-primary-soft`, `--fh-color-error` and `--fh-color-error-soft`. The name of a step with errors uses `--fh-color-text` instead of `--fh-color-error`.
