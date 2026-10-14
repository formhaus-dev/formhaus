---
title: "Translations"
description: "Translate Formhaus forms: message and label catalogs, translation keys from Lokalise with i18next or vue-i18n, and per-language overlay files."
---

# Translations

A definition keeps texts in its source language. Translate it with your app's keys or with an overlay file per language.

```bash
npm install @formhaus/core @formhaus/react   # or @formhaus/vue
```

## Messages and labels

`messages` and `labels` replace the built-in English texts. `{min}`, `{max}`, `{current}` and `{total}` are filled in.

```json
{
  "id": "feedback",
  "lang": "ru",
  "title": "Обратная связь",
  "messages": { "required": "Обязательное поле", "minLength": "Минимум {min} символов" },
  "labels": { "continue": "Далее", "back": "Назад", "stepOf": "Шаг {current} из {total}" },
  "submit": { "label": "Отправить" },
  "fields": [{ "key": "name", "type": "text", "label": "Имя", "validation": { "required": true, "minLength": 2 } }]
}
```

Field messages such as `minLengthMessage` win over `messages`. All keys are in the [specification](/spec#message-and-label-catalogs).

## Translation keys

Put your existing keys in `i18n` objects. The literal texts stay as the fallback.

```json
{
  "id": "signup",
  "title": "Create your account",
  "i18n": { "messages": { "required": "errors.required" }, "labels": { "continue": "common.next" } },
  "submit": { "label": "Create account", "i18n": { "label": "signup.submit" } },
  "fields": [
    {
      "key": "password", "type": "password", "label": "Password",
      "i18n": { "label": "signup.password.label" },
      "validation": { "required": true, "minLength": 8, "i18n": { "minLength": "errors.password.tooShort" } }
    }
  ]
}
```

Texts without a key keep the source text with `prefix: false`. Without it, Formhaus also asks derived keys such as `signup.title` and `signup.messages.minLength`.

### React with react-i18next

```tsx
import { useTranslation } from 'react-i18next';
import { FormRenderer } from '@formhaus/react';
import { useLocalizedForm } from '@formhaus/react/i18n';
import definition from './signup.json';

export function Signup() {
  const { t, i18n } = useTranslation('forms');
  const form = useLocalizedForm(definition, {
    translate: (key, params, defaultValue) => t(key, { ...params, defaultValue }),
    prefix: false,
    lang: i18n.language,
  });
  return <FormRenderer {...form} onSubmit={save} />;
}
```

The hook rebuilds the form when `lang` changes. Pass other changes, such as a namespace that finished loading, as the third argument: `useLocalizedForm(definition, source, [ready])`.

Lokalise: export the `forms` namespace as nested JSON with i18next placeholders, so `errors.password.tooShort` can read `Не менее {{min}} символов`.

### Vue with vue-i18n

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FormRenderer } from '@formhaus/vue';
import { useLocalizedForm } from '@formhaus/vue/i18n';
import definition from './signup.json';

const { t, te, locale } = useI18n();
const form = useLocalizedForm(definition, () => ({
  translate: (key, params, fallback) => (te(key) ? t(key, params) : fallback),
  prefix: false,
  lang: locale.value,
}));
</script>

<template>
  <FormRenderer v-bind="form" @submit="save" />
</template>
```

`te` keeps vue-i18n from returning the key for a missing message. vue-i18n placeholders are `{min}`. Write `@` as `{'@'}` in vue-i18n messages; a message that fails to compile falls back to the source text.

## Overlays

An overlay is one JSON file per language with the translated texts, nested by step id, field key and option value.

```json [signup.ru.json]
{
  "title": "Создайте аккаунт",
  "submit": { "label": "Создать аккаунт" },
  "messages": { "required": "Обязательное поле", "minLength": "Минимум {min} символов" },
  "labels": { "continue": "Далее", "back": "Назад", "stepOf": "Шаг {current} из {total}" },
  "steps": {
    "account": {
      "title": "Аккаунт",
      "fields": {
        "email": { "label": "Почта", "validation": { "required": "Укажите почту" } },
        "plan": { "label": "Тариф", "options": { "free": "Бесплатный", "pro": "Про" } }
      }
    }
  }
}
```

```tsx
import { useLocalizedForm, type Overlay } from '@formhaus/react/i18n';

export function Signup({ lang, overlay }: { lang: string; overlay?: Overlay }) {
  const form = useLocalizedForm(definition, overlay && { overlay, lang });
  return <FormRenderer {...form} onSubmit={save} />;
}

const overlay = lang === 'en' ? undefined : (await import(`./signup.${lang}.json`)).default;
```

Missing or empty strings keep the source text, so an incomplete translation still works. The same file loads into i18next with `i18n.addResourceBundle('ru', 'forms', { signup: overlay })`, and derived keys then resolve through `t`.

Check a translation before you ship it:

```ts
import { textSlots, translationIssues, translationTemplate } from '@formhaus/core/i18n';

const template = translationTemplate(definition);
const { missing, unknown, invalid, placeholderMismatch, unlabeled } = translationIssues(definition, overlay);
```

`textSlots(definition)` lists every text with its address, key, placeholders and a hash. Store the hashes next to the overlay, such as in `signup.ru.meta.json`, and `translationIssues(definition, overlay, { slots })` also reports `stale` texts whose source changed.

## Translation management

| Tool | Settings |
|---|---|
| Lokalise | Nested JSON. Numeric option values such as `"0"` export as arrays unless the key separator is `:::`. |
| Crowdin | Nested JSON. Quote identifiers with dots. |
| Phrase | Nested JSON with `preserve_data_types` off and plural detection off. Phrase rebuilds nesting from dots. |

Use letters, digits, `-` and `_` in form ids, step ids, field keys and option values. `checkTranslations()` warns about `.` and `:` once the definition has translation keys.

## Server

Validate with the localized definition so 422 errors come back in the user's language:

```ts
import { localize } from '@formhaus/core/i18n';
import { validateSubmission } from '@formhaus/core/server';

const { definition: localized, messages } = localize(definition, { overlay: overlays[lang] });
const { errors } = validateSubmission(localized, body.values, { skippedSteps: body.skippedSteps, messages });
```

## Agents

The MCP tool `translation_template` returns the overlay skeleton and the slot list for a language. `simulate_path` takes an `overlay` to run the form in that language. See [MCP](/guide/mcp).

## Limits

- The language is set when the form is created. A new language recreates the form and clears its answers.
- Options from `optionsFrom` and messages from custom validators are not translated here; translate them in the provider or the validator.
- Templates have no plural forms. A translate function can choose the plural itself.
- `lang` does not set text direction.
