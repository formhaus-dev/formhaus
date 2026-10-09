---
"@formhaus/vue": minor
---

- `FormActions` renders a Skip button on steps with `skip` and emits `skip`. New `skipAction`, `showSkip` and `skipLabel` props.
- **Breaking:** Back renders with `fh-form-actions__button--secondary`. It was `--text`, or `--primary` when `back` was an object without `variant`.
- **Breaking:** Cancel without `variant` renders with `fh-form-actions__button--text` instead of `--primary`.
- Back, Skip and Cancel use `variant` from their action when it is set.
- **Breaking:** `FormActions` without `showPrimary` or `showBack` derives them from the step like the React adapter. Previously both buttons were hidden.
- `analyticsEvent` emits `step_skipped` instead of `step_completed` for a skipped step, including Skip on the last step.
