---
'@formhaus/core': minor
'@formhaus/react': minor
'@formhaus/vue': minor
---

- **Breaking:** the `locale` prop and engine option take every source of one language: catalogs, translation files with a `locale` tag and `{ locale, translate, prefix }`. Migrate with `locale={[{ ...overlay, locale: 'ru' }, ru]}` in place of `useLocalizedForm(definition, { overlay, lang: 'ru' })`.
- **Breaking:** removed `useLocalizedForm()` and the `@formhaus/react/i18n` and `@formhaus/vue/i18n` entries.
- **Breaking:** `localize(definition, locale)` takes the same sources as `locale`. `OverlaySource` and `LocalizeSource` are removed.
- **Breaking:** `locale` texts win over `messages` and `labels` of the definition.
- A new `locale` switches the texts of an open form and keeps its answers.
- Messages and labels of a translation file can have plural forms.
- The `<form>` element gets `lang` from the first `locale` source.
