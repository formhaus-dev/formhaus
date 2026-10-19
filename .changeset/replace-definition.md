---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `engine.replaceDefinition(definition)` switches a running form to a new definition and keeps the answers, the current step and the errors that still fit.
- New `keepValues` prop on `FormRenderer` and `HeadlessFormRenderer` keeps the answers when the `definition` prop changes. Without it, a new definition still resets the form.
- `useFormEngine` in React and Vue takes `keepValues` in its options. The new `UseFormEngineOptions` type describes them.
- A value is kept when the new definition has a field with the same key and type. Values of removed fields and of fields whose type changed are dropped.
