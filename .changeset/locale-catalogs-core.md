---
"@formhaus/core": minor
---

- New `locale` option on `FormEngine` takes a `LocaleCatalog` or a list of them. Per key, `messages` wins over `definition.messages`, which wins over the catalogs in array order, which win over the built-in English.
- A catalog text can be an object of plural forms, picked by `Intl.PluralRules` for the catalog locale on `{count}`, `{min}` or `{max}`. That number is formatted with `Intl.NumberFormat` for the same locale.
- Message and label catalogs for `es`, `fr`, `fr-CA`, `de`, `pt-BR`, `it`, `ja`, `zh-CN`, `ru` and `uk`, plus `en`, at `@formhaus/core/locales/<tag>` (typed) and `@formhaus/core/locales/<tag>.json`.
- New `localeChain(tag)` and `checkCatalog(catalog)` in `@formhaus/core/i18n`. `localeChain` adds the likely region, so `zh-Hans-CN` also tries `zh-CN`.
- New types `LocaleCatalog`, `LocaleText` and `PluralForms`.
- A multi-step overlay also accepts `fields.<key>` at the top level. `steps.<id>.fields.<key>` wins when both are set, and `translationIssues()` no longer reports these addresses as unknown.
- A translate function that returns the built-in English text for a message or label key leaves that key to the locale catalogs.
