---
'@formhaus/core': minor
---

- New `time` field type. The browser and `validateSubmission()` accept 24-hour `HH:mm` or `HH:mm:ss` and reject other values with the new `time` message, `Enter a valid time`.
- New `hidden` field type. Its value comes from `defaultValue` or the initial values, and `validateSubmission()` checks it as text.
- An error on a `hidden` field is a form-level error. `topLevelErrors` lists it, `stepErrors` leaves it out and a failed submit does not move to its step.
- Built-in messages on a `hidden` field name the field through the new `hidden` message template, `{label}: {message}`. Custom messages stay as written.
- Server errors for the key of a `hidden` field are form-level errors too.
- A `hidden` field that its conditions show again gets its initial value or `defaultValue` back. Other field types still start empty.
- `time` and `hidden` are new keys in `messages` catalogs and in the translation JSON Schema.
- **Breaking:** `time` is a built-in type. A custom `time` type now fails values that are not 24-hour `HH:mm` or `HH:mm:ss`.
- **Breaking:** `hidden` is a built-in type. A custom `hidden` type now fails values that are not text, and its errors move to `topLevelErrors`.
