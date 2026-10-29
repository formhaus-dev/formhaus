---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- **Breaking:** removed `useLocalizedForm()` and the `@formhaus/react/i18n` and `@formhaus/vue/i18n` entries. Pass `locale={[translation({ ...overlay, locale: 'ru' }), ru]}` in place of `useLocalizedForm(definition, { overlay, lang: 'ru' })`.
- **Breaking:** `localize(definition, locale)` takes the same list as the `locale` prop. `OverlaySource` and `LocalizeSource` are removed.
- New `translation()` in `@formhaus/core/i18n` turns a translation file or `{ locale, translate, prefix }` into a `locale` source, so one `locale` prop covers a language.
- A new `locale` switches the texts of an open form and keeps its answers.
- Messages and labels of a translation file can have plural forms.
- The `<form>` element gets `lang` from the translation.
