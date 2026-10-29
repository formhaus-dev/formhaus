---
title: "Translations"
description: "Translate Formhaus forms: ready-made language catalogs, message and label codes, i18next or vue-i18n keys, and per-language translation files."
---

# Translations

A definition keeps texts in its source language. The `locale` prop takes everything for one language: a ready-made catalog, and a translation of the form from a translation file or from your app's keys.

```bash
npm install @formhaus/core @formhaus/react   # or @formhaus/vue
```

## Messages and labels

Validation messages and renderer labels have fixed codes. Map them to your own texts with the `messages` and `labels` props, as an object or as a function of `(code, params, field)`. A function that returns `undefined` leaves the code to the next source.

```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation('forms');
const text = (prefix: string) => (code: string, params: Record<string, unknown>) =>
  i18n.exists(`${prefix}.${code}`) ? t(`${prefix}.${code}`, params) : undefined;

<FormRenderer definition={definition} messages={text('errors')} labels={text('labels')} onSubmit={save} />
```

Message codes: `required`, `minLength` and `minItems` (`{min}`), `maxLength` and `maxItems` (`{max}`), `min` (`{min}`), `max` (`{max}`), `pattern`, `matchField`, `email`, `number`, `date`, `datetime`, `time`, `option`, `options`, `exclusive` (`{option}`), `boolean`, `string`, `file`, `value` and `hidden` (`{label}`, `{message}`).

Label codes: `continue`, `back`, `stepOf` (`{current}`, `{total}`), `errorSummary`, `addItem`, `removeItem`, `itemLabel` (`{label}`, `{index}`), `itemAdded`, `itemRemoved` and `removeItemPrompt` (`{item}`), `removeItemNamed` (`{label}`, `{item}`), `removeItemBody` (`{item}`), `cancel`, `enlargeImage` (`{label}`), `close`, `clear`, `done`, `chooseFile`, `required`, `skip`, `submit`, `stepTitle` (`{index}`), `stepErrors` (`{count}`), `or` and `select`.

A definition can carry its own `messages` and `labels`:

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

## Languages

Ready-made catalogs translate the message and label codes into `es`, `fr`, `fr-CA`, `de`, `pt-BR`, `it`, `ja`, `zh-CN`, `ru` and `uk`. They ship with `@formhaus/core`, one file per language. `en` is the built-in English as a catalog, for overrides.

```tsx
import ru from '@formhaus/core/locales/ru';

<FormRenderer definition={definition} locale={ru} onSubmit={save} />
```

```vue
<FormRenderer :definition="definition" :locale="ru" @submit="save" />
```

`locale` takes one source or a list: catalogs and `translation()` of a [translation file](#translation-files) or of your [translation keys](#translation-keys). A translation also sets `lang` of the form. `@formhaus/core/locales/ru` is typed. `@formhaus/core/locales/ru.json` is the same catalog as plain JSON. `FormEngine` takes `locale` as an option.

A new `locale` switches the texts and keeps the answers. Shown errors switch on the next validation.

### Load the user's language

`localeChain(tag)` lists the tags to try, from the most specific one to `en`: `fr-CA` gives `['fr-CA', 'fr', 'en']`. It adds the likely region, so `zh-Hans-CN` also tries `zh-CN` and `pt` tries `pt-BR`. Load the catalogs that exist and pass them all. Each catalog is a separate chunk, and English needs none.

<<< @/recipes/snippets/locale-catalogs.ts

<<< @/recipes/snippets/locale-catalogs-page.tsx

### Precedence

For each key, the first source that has it wins:

1. `messages` and `labels` props.
2. Translations in `locale`, in array order.
3. `messages` and `labels` of the definition.
4. Catalogs in `locale`, in array order.
5. Built-in English.

Field messages such as `minLengthMessage` win over all of them, and a translation translates them like other texts of the form. A translate function that returns the English default for a key leaves the key to the next source.

Put your own catalog first to change a few texts:

```ts
import de from '@formhaus/core/locales/de';

const locale = [{ locale: 'de', messages: {}, labels: { submit: 'Senden' } }, de];
```

### Plurals

A text can be an object of plural forms. `Intl.PluralRules` for the catalog `locale` picks the form by `{count}`, `{min}` or `{max}`, and `other` is required. That number is formatted with `Intl.NumberFormat` for the same locale.

```json
{
  "locale": "ru",
  "messages": {
    "minLength": {
      "one": "Не менее {min} символа",
      "few": "Не менее {min} символов",
      "many": "Не менее {min} символов",
      "other": "Не менее {min} символа"
    }
  },
  "labels": {}
}
```

### Check a catalog

```ts
import { checkCatalog } from '@formhaus/core/i18n';

const { missing, unknown } = checkCatalog(catalog);
```

`missing` lists keys without a text, such as `messages.minLength` or `messages.minLength.other`. `unknown` lists keys a ready-made catalog does not need, such as texts of a form. The MCP tool `translation_template` takes a `catalog` and leaves the texts it covers out of the translation file.

### Add a language

Add `packages/core/locales/<tag>.json` to the [repository](https://github.com/formhaus-dev/formhaus) with every key of `en.json`. Keep the `{placeholders}` and give plural texts exactly the forms `Intl.PluralRules` reports for the language. `pnpm --filter @formhaus/core test locales` checks the file.

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
import { translation } from '@formhaus/core/i18n';
import definition from './signup.json';

export function Signup() {
  const { t, i18n } = useTranslation('forms');
  const locale = translation({ locale: i18n.language, translate: (key, params, defaultValue) => t(key, { ...params, defaultValue }), prefix: false });
  return <FormRenderer definition={definition} locale={locale} onSubmit={save} />;
}
```

An inline `translate` is safe: the form keeps its answers and calls the latest function. The texts of the form update when a namespace finishes loading.

Lokalise: export the `forms` namespace as nested JSON with i18next placeholders, so `errors.password.tooShort` can read `Не менее {{min}} символов`.

### Vue with vue-i18n

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { FormRenderer } from '@formhaus/vue';
import { translation } from '@formhaus/core/i18n';
import definition from './signup.json';

const { t, te, locale } = useI18n();
const source = computed(() =>
  translation({
    locale: locale.value,
    translate: (key, params, fallback) => (te(key) ? t(key, params) : fallback),
    prefix: false,
  }),
);
</script>

<template>
  <FormRenderer :definition="definition" :locale="source" @submit="save" />
</template>
```

`te` keeps vue-i18n from returning the key for a missing message. Set `fallbackLocale: false` in `createI18n()`, otherwise `te` also finds the key in the fallback locale and a missing text shows in that language instead of the source text. vue-i18n placeholders are `{min}`. Write `@` as `{'@'}` in vue-i18n messages; a message that fails to compile falls back to the source text.

## Translation files

A translation file holds the texts of one form in one language, nested by step id, field key and option value. `locale` is its language tag.

```json [signup.ru.json]
{
  "locale": "ru",
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
import ru from '@formhaus/core/locales/ru';
import { translation } from '@formhaus/core/i18n';
import signupRu from './signup.ru.json';

<FormRenderer definition={definition} locale={[translation(signupRu), ru]} onSubmit={save} />
```

Load the file for a language before rendering:

```ts
import { translation } from '@formhaus/core/i18n';
import type { Translation } from '@formhaus/core';

async function loadTranslation(lang: string): Promise<Translation | undefined> {
  return lang === 'en' ? undefined : translation((await import(`./signup.${lang}.json`)).default);
}
```

`translation()` lives in `@formhaus/core/i18n`, so forms without one do not load it.

A message or label in the file can be an object of [plural forms](#plurals).

Field texts live at `fields.<key>`. In a multi-step form they can also live at `steps.<id>.fields.<key>`, which wins when both are set. Missing or empty strings keep the source text, so an incomplete translation still works. A field message in the definition, such as `required: "Enter your email"`, wins over `messages` of the file; translate it at the field address. The same file loads into i18next with `i18n.addResourceBundle('ru', 'forms', { signup: file })`, and derived keys then resolve through `t`.

Sections and groups have their own addresses. A section title lives at `sections.<key>.title`, or `steps.<id>.sections.<key>.title` in a multi-step form, and the fields inside keep their usual address. A group keeps `fields.<key>.label` and adds `itemLabel`, `addLabel` and `removeLabel`. Its item fields live under `fields.<key>.fields.<item key>`. The `labels` catalog has `addItem`, `removeItem`, `itemLabel` (`{label} {index}`), `itemAdded`, `itemRemoved` and `removeItemNamed`, `removeItemPrompt` (`{item}`), and `removeItemBody` and `cancel`. A translated `itemLabel` must keep `{index}`. Forms with picture options add `enlargeImage` (`{label}`, the name of the button that opens the image) and `close` (the button that closes it). Forms with [exclusive options](/guide/fields#none-of-these) add `or`, the divider before them.

The step progress and the action bar read `stepTitle` (`{index}`, the name of a step without a title), `stepErrors` (`{count}`, the error mark of a step), and `skip` and `submit` (the buttons when the action has no label). `required` is the word assistive technology announces for a required field; web renderers add it to the legend of a required option group. Native renderers also read `clear`, `done` (the confirm button of a date or time picker), `chooseFile` and `select` (the prompt of an empty select). A translation template asks for each of these only when the form uses it.

```json
{
  "sections": { "billing": { "title": "Платёжный адрес" } },
  "fields": {
    "participants": {
      "itemLabel": "Участник {index}",
      "addLabel": "Добавить участника",
      "fields": { "email": { "label": "Почта" } }
    }
  },
  "labels": { "removeItem": "Удалить", "itemRemoved": "{item} удалён" }
}
```

Check a translation before you ship it:

```ts
import { textSlots, translationIssues, translationTemplate } from '@formhaus/core/i18n';

const template = translationTemplate(definition);
const { missing, unknown, invalid, placeholderMismatch, unlabeled } = translationIssues(definition, signupRu);
```

`textSlots(definition)` lists every text with its address, key, placeholders and a hash. Store the hashes next to the file, such as in `signup.ru.meta.json`, and `translationIssues(definition, signupRu, { slots })` also reports `stale` texts whose source changed.

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
import { localize, translation } from '@formhaus/core/i18n';
import { validateSubmission } from '@formhaus/core/server';

const { definition: localized, messages } = localize(definition, [translation(files[lang]), catalogs[lang]]);
const { errors } = validateSubmission(localized, body.values, { skippedSteps: body.skippedSteps, messages });
```

## Agents

The MCP tool `translation_template` returns the translation file skeleton and the slot list for a language. `simulate_path` takes it as `overlay` to run the form in that language. See [MCP](/guide/mcp).

## Limits

- Options from `optionsFrom` and messages from custom validators are not translated here; translate them in the provider or the validator.
- `messages` and `labels` of the definition have no plural forms. Use a translation file or a catalog, or choose the plural in a translate function.
- `lang` does not set `dir` or right-to-left layout.
- `localize()` throws on the errors of `checkTranslations()`, such as an `i18n` key for a text the definition does not have.

## Migrate from 1.6

`useLocalizedForm()` and the `@formhaus/react/i18n` and `@formhaus/vue/i18n` entries are gone. Wrap the source in `translation()` with its language tag and pass it to `locale`:

```tsx
// Before
const form = useLocalizedForm(definition, { overlay, lang: 'ru' });
<FormRenderer {...form} locale={ru} onSubmit={save} />

// After
<FormRenderer definition={definition} locale={[translation({ ...overlay, locale: 'ru' }), ru]} onSubmit={save} />
```

A translate source takes `locale` in place of `lang`, and `localize(definition, locale)` takes the same list as the `locale` prop.
