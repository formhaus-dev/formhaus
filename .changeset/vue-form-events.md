---
'@formhaus/vue': minor
---

- New `formEvent` emit replaces `analyticsEvent`, which keeps working until 1.0. When both are set, both receive every event.
- Existing `analyticsEvent` handlers now also receive the new events, `step_viewed` on mount and on Back, and `field_error` when Continue fails validation.
- `form_viewed` and the first `step_viewed` fire when the form mounts.
- `step_viewed` fires on every step change, including Back and a jump to a field with an error.
- New `field_shown`, `field_hidden`, `form_submit_succeeded`, `form_submit_failed` and `form_reset` events.
- `FormhausForm` emits `formEvent` and `analyticsEvent`.
- Fixed `field_blurred` reporting `hasValue: false` for group item fields.
