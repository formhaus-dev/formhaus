---
'@formhaus/vue': minor
---

- New `messages` prop for validation messages, an object of templates or a function.
- New `labels` prop for the Continue and Back buttons, the step counter and the error summary title, an object of templates or a function.
- The `<form>` element gets `lang` from the definition.
- Custom progress components receive the step counter text as `counterLabel`.
- New `@formhaus/vue/i18n` entry with `useLocalizedForm()`, a computed ref with the props of a form in one language.
- Requires `@formhaus/core` 0.13.
