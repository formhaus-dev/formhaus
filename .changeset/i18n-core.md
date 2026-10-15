---
'@formhaus/core': minor
---

- New `lang`, `messages` and `labels` definition properties. `messages` replaces the built-in validation messages, with `{min}` and `{max}` filled in.
- New `i18n` objects on the definition, steps, fields, options, actions and `validation` map texts to translation keys of the app. The texts stay as the fallback.
- New `messages` option of `FormEngine` and `validateSubmission()`, an object of templates or a function.
- Field messages win over the `messages` option, and the `messages` option wins over `definition.messages`.
- `validateFieldValue()`, `validateFields()` and `validateStep()` take an optional `messages` argument after `validators`.
- `getDefaultMessage()` accepts every message key, including `minItems`, `maxItems`, `email` and `date`.
- New `@formhaus/core/i18n` entry with `localize()`, which applies a translation file or a translate function such as i18next `t`.
- New `defaultMessages` and `defaultLabels` in `@formhaus/core/i18n` hold the English templates.
- New `translationTemplate()`, `textSlots()` and `translationIssues()` in `@formhaus/core/i18n` for translation files.
- New JSON Schema for translation files at `@formhaus/core/translation.schema.json` and https://formhaus.dev/schema/form-translation.json.
- New `checkTranslations()` in `@formhaus/core/i18n` reports `i18n-unbound-slot` (error), `unknown-i18n-slot`, `unknown-message-key`, `unknown-label-key` and `i18n-unsafe-identifier` (warnings). `localize()` throws on its errors.
- Definitions that use `lang`, `messages`, `labels` or `i18n` fail the JSON Schema of 0.12 and earlier. Older cores ignore these properties.
- `lang`, `messages` and `labels` are reserved. `FormEngine` ignores `messages` and `labels` entries that are not strings.
