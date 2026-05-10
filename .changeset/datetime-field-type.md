---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

Added `'datetime'` to `DefaultFieldType`. React and Vue ship a `DateTimeField` component that renders `<input type="datetime-local">`.

The native input emits `YYYY-MM-DDTHH:mm` without timezone — see the field types guide for the timezone caveat and how to swap in a richer picker (MUI `DateTimePicker`, react-aria `DateField`).
