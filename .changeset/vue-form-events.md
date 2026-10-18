---
'@formhaus/vue': minor
---

- New `formEvent` emit replaces `analyticsEvent`, which keeps working until 1.0.
- `form_viewed` and the first `step_viewed` fire when the form mounts.
- `step_viewed` fires on every step change, including Back and a jump to a field with an error.
- `field_error` also fires when Continue fails validation.
- New `form_submit_succeeded`, `form_submit_failed` and `form_reset` events.
- `FormhausForm` emits `formEvent` and `analyticsEvent`.
- Fixed `field_blurred` reporting `hasValue: false` for group item fields.
