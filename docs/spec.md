---
title: "Form definition 1.5 specification"
description: "Formhaus form definition format 1.5: structure, fields, sections, groups, conditions, validation, steps, routes, answer recall, translations and the payload."
---

# Formhaus form definition 1.5

This page specifies the JSON format that `@formhaus/core` reads, and how `FormEngine` interprets it. The [JSON Schema](https://formhaus.dev/schema/form-definition.json) describes the shape; this page describes the behaviour. For the TypeScript types, see the [Definition Reference](/api/definition).

## Conventions

The key words MUST, MUST NOT, SHOULD and MAY are used as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They appear only where `FormEngine` enforces the rule by throwing an error or by its runtime behaviour.

- **Core** means `FormEngine` from `@formhaus/core`.
- **Renderer** means a UI layer that draws a definition: `@formhaus/react`, `@formhaus/vue`, the Figma plugin, or a custom renderer built on core.
- **Value** means an entry in `engine.values`, keyed by field `key`.
- **Node** means an entry of a `fields` array: a [field](#fields), a [section](#sections) or a [group](#groups).
- **Empty** (blank) means `undefined`, `null`, `''` or `[]`. `notEmpty` matches any value that is not blank, so `false` and `0` count as values. For `required`, an unchecked `checkbox` or `switch` (`false`) is also empty.

## Versioning

This document describes **Formhaus form definition 1.5**. `@formhaus/core` 0.21 and later implement it. Format 1.4, implemented by `@formhaus/core` 0.20, is 1.5 without [answer recall](#answer-recall), [exclusive options](#exclusive-options) and the field [`autocomplete`](#autocomplete). Format 1.3, implemented by `@formhaus/core` 0.19, is 1.4 without the [`contains` and `notContains`](#conditions) operators. Format 1.2, implemented by `@formhaus/core` 0.15 to 0.18, is 1.3 without the [`scale` and `rating`](#scale-and-rating) types, option [`image`](#picture-options), field [`columns`](#picture-options) and section [`layout`](#matrix). Format 1.1, implemented by `@formhaus/core` 0.14, is 1.2 without the field `props`. Format 1.0, implemented by `@formhaus/core` 0.11 to 0.13, is 1.1 without [sections](#sections) and [groups](#groups).

- Additive changes, such as a new optional property or a new built-in field type, are minor versions.
- Removing or renaming a property, or changing the meaning of an existing one, is a major version.
- The JSON Schema `$id`, `https://formhaus.dev/schema/form-definition.json`, is the canonical identifier of the format. It is unversioned and always describes the latest version. A major version publishes the previous schema under a versioned URL and states it in this section.

A definition MAY declare its format with `formatVersion`, a string `MAJOR` or `MAJOR.MINOR`, such as `"1.5"`. Without it, core reads the definition as 1.5, but shows `{{key}}` tokens as written. A minor version newer than 1.5 is also read as 1.5. Core reports `unsupported-format-version` for a major version newer than 1, and `invalid-type` for a value of another shape. In both cases it does not check the rest of the definition.

A definition with sections or groups SHOULD declare `"formatVersion": "1.1"` or newer. Core 0.13 and older read a section or a group as a field of a custom type: they skip the fields inside it, and their `validateSubmission()` passes a group value without checks. `checkDefinition()` warns about a section or a group without format 1.1. Upgrade the server that runs `validateSubmission()` before the clients.

A definition with `props` MAY declare `"formatVersion": "1.2"`. Core 0.14 reports `props` as `unknown-property` and ignores it; its renderers still pass it to custom components.

A definition with a `scale` or `rating` field SHOULD declare `"formatVersion": "1.3"`. Core 0.18 and older read these types as custom types: they skip the type check, and their `validateSubmission()` accepts any value for them. `checkDefinition()` warns about a `scale` or `rating` field without format 1.3. Upgrade the server that runs `validateSubmission()` before the clients. A definition with option `image`, field `columns` or section `layout` MAY declare 1.3. Core 0.18 reports them as `unknown-property`, and its renderers draw plain options and a plain section.

A definition with a `contains` or `notContains` condition SHOULD declare `"formatVersion": "1.4"`. Core 0.19 and older reject it with `unknown-operator`: the constructor and `validateSubmission()` throw. `checkDefinition()` warns about these operators without format 1.4. Upgrade the server that runs `validateSubmission()` before the clients.

A definition whose texts recall answers MUST declare `"formatVersion": "1.5"` or newer. Without it, and in core 0.20 and older, the texts show `{{key}}` as written. `checkDefinition()` warns about a `{{key}}` token without format 1.5.

A definition with an [exclusive option](#exclusive-options) SHOULD declare `"formatVersion": "1.5"`. Core 0.20 and older report `exclusive` as `unknown-property` and ignore it: their engine keeps the other answers, and their `validateSubmission()` accepts an exclusive option with other values. `checkDefinition()` warns about an exclusive option without format 1.5. Upgrade the server that runs `validateSubmission()` before the clients.

```json
{ "formatVersion": "1.5", "id": "contact", "title": "Contact", "submit": { "label": "Send" } }
```

A definition with a field `autocomplete` MAY declare `"formatVersion": "1.5"`. Core 0.20 reports `autocomplete` as `unknown-property`, and its renderers do not set the attribute. `checkDefinition()` warns about `autocomplete` without format 1.5.

## Document structure

A definition is a JSON object. The [JSON Schema](https://formhaus.dev/schema/form-definition.json) rejects unknown properties at every level. `checkDefinition()` reports them as `unknown-property` warnings, and the engine ignores them.

| Property | Type | Required | Meaning |
|---|---|---|---|
| `$schema` | string | no | Editor hint. Core ignores it. |
| `formatVersion` | string | no | [Format version](#versioning) of the definition. |
| `id` | string | yes | Form identifier. Renderers use it to detect a new form. |
| `lang` | string | no | BCP 47 language tag of the texts, such as `"ru"`. Renderers set it as the `lang` attribute of the form. See [Translations](#translations). |
| `messages` | object | no | Validation message templates by [message key](#message-and-label-catalogs). |
| `labels` | object | no | Renderer label templates by [label key](#message-and-label-catalogs). |
| `i18n` | object | no | [Translation keys](#translation-keys) for `title`, `description`, `messages` and `labels`. |
| `title` | string | yes | Form title for host UI and Figma output. Renderers do not display it. |
| `description` | string | no | Plain text shown under the title by host UI and Figma output, up to 1000 characters. Renderers do not display it. |
| `submit` | [action](#actions) | yes | The submit action on the last step. |
| `cancel` | [action](#actions) | no | A cancel action. Renderers show it on every step. |
| `fields` | [node](#conventions)[] | no | Fields, sections and groups of a single-step form. |
| `steps` | [step](#steps)[] | no | Steps of a multi-step form. |

A form is **multi-step** when `steps` is a non-empty array. Otherwise it is single-step and uses `fields`. A definition with neither is a valid empty form.

A definition MUST NOT have both a non-empty `fields` and a non-empty `steps`. The `FormEngine` constructor throws on it.

## Fields

| Property | Type | Meaning |
|---|---|---|
| `key` | string, required | Key of the value. Keys are flat: `"address.city"` stays one key. |
| `type` | string, required | [Field type](#field-types). |
| `label` | string, required except for `hidden` | Label text. |
| `placeholder` | string | Placeholder text. |
| `helperText` | string | Hint text between the label and the control. |
| `defaultValue` | any | Initial value. See [Defaults](#defaults-and-initial-values). |
| `show` | [condition](#conditions)[] | Visible when all conditions match. |
| `showAny` | [condition](#conditions)[] | Visible when at least one condition matches. |
| `validation` | [validation](#validation) | Validation rules. |
| `options` | `{ value: string, label: string, image?: string, exclusive?: boolean }[]` | Choices for `select`, `radio`, `multiselect` and `autocomplete`. Anchor labels for `scale` and `rating`. |
| `layout` | `"stack"` or `"inline"` | Option layout for `radio` and `multiselect`. `stack` (default) lists options vertically. `inline` places short options side by side. |
| `columns` | integer, 1 to 4 | Cards per row for [picture options](#picture-options). |
| `optionsFrom` | string | Name of a renderer options provider. |
| `optionsDependsOn` | string[] | Field keys whose changes reload `optionsFrom`. |
| `autoAdvance` | boolean | See [Auto-advance](#auto-advance). |
| `accept` | string | Accepted file types for `file`. |
| `rows` | number | Row count for `textarea`. |
| `mask` | string | Input mask. The built-in `text`, `email`, `phone`, `number` and `password` inputs use it as the placeholder when `placeholder` is absent. |
| `inputMode` | `text`, `numeric`, `decimal`, `tel`, `email`, `url`, `search` | Virtual keyboard hint, applied by the built-in `text`, `email`, `phone`, `number` and `password` inputs. |
| `autocomplete` | string | HTML autofill token, such as `given-name`. See [Autocomplete](#autocomplete). Added in 1.5. |
| `props` | object | Settings of a [custom type](#field-types). Core ignores it. Renderers pass it unchanged as `field.props`. Added in 1.2. |
| `i18n` | object | [Translation keys](#translation-keys) for `label`, `placeholder` and `helperText`. |

An option MAY have `i18n: { label }`, an [`image`](#picture-options) and [`exclusive`](#exclusive-options). `validation` MAY have `i18n` with keys by rule name.

Field keys MUST be unique on every possible path. Two fields MAY share a key only when they are on route branches that never meet on one path; then the field on the active path owns the value. The constructor throws on any other duplicate. Section keys share this namespace.

### Autocomplete

`autocomplete` is an [HTML autofill token](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls:-the-autocomplete-attribute), such as `given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `bday`, `organization`, `one-time-code` or `off`. It lets browsers and password managers fill the field, as WCAG 2.2 success criterion 1.3.5 requires for personal data. The built-in React and Vue renderers set it as the `autocomplete` attribute of the input, `textarea` or `select`. A renderer MUST NOT guess a token when the field has none.

The value is one token, or tokens separated by spaces: an optional `section-*` name, then `shipping` or `billing`, then for `tel`, `email` and `impp` an optional contact type (`home`, `work`, `mobile`, `fax`, `pager`), then the field name. Case and extra spaces do not matter. `on` and `off` stand alone.

`autocomplete` applies to `text`, `email`, `phone`, `password`, `textarea`, `number`, `date`, `select`, `autocomplete` and `radio` fields, and to custom types. For `radio`, the renderers set it on each input. The `autocomplete` type sets `off` when the field has no `autocomplete`. It does not change validation. In a group item, the built-in renderers put `section-<group key>-<item index>` before the token, such as `section-guests-1 name`, with every character of the key other than `a-z` and `0-9` written as `_<hex code point>_`, so that browsers do not fill every item with the same value. `on` and `off` stay as written. A token with its own section keeps it after the item section: `section-home street-address` in item 1 of `guests` becomes `section-guests-1-home street-address`.

### Line breaks in texts

A `\n` in a step or section `description`, a field or group `helperText` or a statement text starts a new line in the built-in renderers. The text stays plain: there is no HTML or Markdown.

### Field types

`type` is any string. The built-in renderers provide these types:

| Type | Value written by built-in renderers |
|---|---|
| `text`, `email`, `phone`, `password`, `textarea`, `autocomplete`, `hidden` | string |
| `number` | number, or `null` when the input is cleared |
| `select`, `radio` | string, the selected option `value` |
| `multiselect` | string[] of distinct selected option values |
| `checkbox`, `switch` | boolean |
| `file` | a `File`, or `null` |
| `date` | string `YYYY-MM-DD` |
| `datetime` | string `YYYY-MM-DDTHH:mm`, without a timezone |
| `time` | string `HH:mm`, 24-hour |
| `scale`, `rating` | integer number, the selected point. See [Scale and rating](#scale-and-rating) |

A `hidden` field renders no label and no focusable control. Its value comes from the initial values, then its `source`, then `defaultValue`. Its value is text of at most `maxLength` characters, or 2000 without it. Its conditions, rules and type check work like those of any other field. While it is active, an error under its key is a form-level error: `topLevelErrors` lists it after the other form-level errors, and the error summary, step error counts and focus skip the field. `errors` and `validate()` still list it under its key. Built-in messages for it are wrapped in the `hidden` message template, which names the field by its `label`, or by its `key` when the label is empty. A message set in the definition, such as a string `required` or `patternMessage`, and a validator result stay as written. Server errors under its key are handled the same way but are not wrapped.

A `hidden` field may have a `source`: `{ "query": name }` or one of `referrer`, `page`, `pageTitle`, `language`, `timezone`, `device` and `country`. Any other value is an `unknown-source` or `invalid-type` error. A `source` on another field type is a `source-not-applicable` warning and is ignored. Renderers resolve sources in the browser after mount, without marking a change, from this context:

| Source | Value |
|---|---|
| `query` | The named URL parameter |
| `referrer` | Origin and path of `document.referrer`, without query and hash |
| `page` | Origin and path of the page URL, without query and hash |
| `pageTitle` | `document.title` |
| `language` | `navigator.language` |
| `timezone` | The IANA time zone name |
| `device` | `mobile`, `tablet` or `desktop` |
| `country` | Supplied by the host, such as a server. Browsers supply none |

A value is used when it is a string that is not empty after trimming. It is cut to the field's `maxLength`, or 2000 characters without it. Otherwise, or when reading it throws, the source yields nothing and `defaultValue` stays. A key present in the initial values with a value other than `""` or `null` is not resolved. The resolved value is also the value a `hidden` field gets back when its conditions match again. `reset()` and Skip drop resolved values, and renderers resolve again only when they mount or get a new definition. With `keepValues`, a renderer resolves the sources of a new definition only for fields that hold no value.

Any other string is a **custom type**. A renderer provides its component through its `components` option and passes it the whole field, so the component reads its settings from `field.props`. The built-in React and Vue renderers show an "Unsupported field type" placeholder for a type without a component. Core runs type checks for built-in types (see [Validation](#validation)) and treats an unchecked `checkbox` or `switch` (`false`) as empty for `required`. It does not interpret custom types.

Built-in type names are single lowercase words without separators. A type name with `-` or `:`, such as `x-rating`, `acme-rating` or `acme:rating`, is reserved for custom types and never becomes a built-in type. A custom type without `-` or `:` can collide with a built-in type added in a later minor version, which then applies its type checks to the field.

### Scale and rating

`scale` and `rating` ask for one point on a numeric range. The built-in renderers draw `scale` as a row of numbered boxes and `rating` as a row of stars.

- **Range.** For `scale`, the points run from `validation.min` to `validation.max`. `min` defaults to 1 and `max` to 5. We recommend `min` 0 or 1 and 3 to 11 points; this is advice, not a check. For `rating`, the stars run from 1 to `validation.max`, which defaults to 5. We recommend 3 to 10 stars. Bounds that are not integers, or a range of fewer than 2 or more than 11 points, are an `invalid-scale` error: `rating` `max` must be 2 to 11.
- **Value.** An integer number of the range, such as `7`. Built-in renderers write a number. Core does not convert a numeric string in the browser; `validateSubmission()` converts a decimal string, such as `"7"`, to a number before the checks, as it does for `number`.
- **Empty.** Like any field: `undefined`, `null` or `''`. `0` is a value, so `0` on a 0-based scale passes `required` and `notEmpty`.
- **Type check.** A value that is not an integer of the range fails with the `option` message. `7.5`, `11` on a 0 to 10 scale, `"7"` in the browser and `true` all fail.
- **`required`.** Works as on any field.
- **`min` and `max` on `scale`.** They define the range. A value outside it fails the type check, so `minMessage` and `maxMessage` never show.
- **`min` and `max` on `rating`.** `max` defines the range. `min` is an ordinary rule: a rating below it fails with the `min` message, such as `Must be at least 3`.
- **`defaultValue`.** A point of the range. Another value fails validation like any other value.
- **`minLength`, `maxLength`.** Do not apply. `checkDefinition()` warns with `rule-not-applicable`.
- **Anchors.** `options` are optional anchor labels. An anchor `value` is the point number as a string, such as `"0"`, and its `label` is the text. Renderers show the labels of three points: the first point at the start, the last point at the end and the middle point, `floor((min + max) / 2)`, in the center. Labels on other points are not shown. Anchors are not choices: core does not check values against them, and `checkDefinition()` does not compare condition values with them.
- **Conditions.** `eq`, `neq`, `in` and `notIn` compare numbers, and `gt`, `gte`, `lt` and `lte` compare the point. `checkDefinition()` warns about a string operand with `condition-value-mismatch`.
- **Keyboard.** Each point is a native radio. Arrow keys move between points. Digit keys 0 to 9 select the point with that number; on a range that ends at 10 and starts at 1, `0` selects 10.

An NPS question is a `scale` from 0 to 10 with two anchors. Branch on detractors with `lte: 6` and on promoters with `gte: 9`:

```json
{
  "formatVersion": "1.3",
  "id": "nps",
  "title": "NPS",
  "submit": { "label": "Send" },
  "fields": [
    {
      "key": "score", "type": "scale", "label": "How likely are you to recommend us to a friend?",
      "validation": { "required": true, "min": 0, "max": 10 },
      "options": [{ "value": "0", "label": "Not at all likely" }, { "value": "10", "label": "Extremely likely" }]
    },
    { "key": "fix", "type": "textarea", "label": "What should we fix first?", "show": [{ "field": "score", "lte": 6 }] },
    { "key": "love", "type": "textarea", "label": "What do you like most?", "show": [{ "field": "score", "gte": 9 }] },
    { "key": "stars", "type": "rating", "label": "Rate the support you got", "validation": { "max": 5 } }
  ]
}
```

### Options

`options` is a static list. `optionsFrom` names an options provider passed to the renderer. Built-in renderers call the provider with all current values, and again each time a field in `optionsDependsOn` changes. The returned options replace `options`. Core checks that a `select`, `radio` or `multiselect` value is one of the static `options`. It skips that check when `optionsFrom` is set, so the app validates dynamic lists itself. Core does not read `optionsDependsOn`.

### Picture options

An option of a `radio` or `multiselect` field MAY have `image`, the URL of a picture. The built-in renderers show it above the label and place the options in a grid. The label stays required and visible, and it names the option for assistive technology, so the image has an empty `alt`. The value is the option `value`, as for any option. `select` and `autocomplete` ignore `image`. Images load from the URL as given; a strict Content Security Policy needs `img-src` for its host. The image host sees the respondent's IP address. The built-in renderers send no `Referer` header with option images. An `image` that does not start with `https:` or `data:image/` is an `unsafe-image-url` warning.

`columns` sets the number of cards per row, from 1 to 4. Without it, the built-in renderers fill the row with cards about 200px wide. On screens narrower than 480px they show at most 2 cards per row. Any other value is an `invalid-type` or `invalid-range` error. `columns` is a `columns-not-applicable` warning and is ignored on a field whose options have no `image`, on a field type other than `radio` and `multiselect`, and on a field whose parent container has `layout: "matrix"`. Each card has a button that opens the image at full size.

### Exclusive options

An option of a `multiselect` field MAY have `"exclusive": true`. It is the only answer when picked, as in "None of these" or "Prefer not to say".

```json
{
  "formatVersion": "1.5",
  "id": "health",
  "title": "Health",
  "submit": { "label": "Send" },
  "fields": [
    {
      "key": "conditions",
      "type": "multiselect",
      "label": "Do you have any of these conditions?",
      "options": [
        { "value": "asthma", "label": "Asthma" },
        { "value": "diabetes", "label": "Diabetes" },
        { "value": "none", "label": "None of these", "exclusive": true }
      ]
    }
  ]
}
```

- `setValue()` and `setItemValue()` apply the rule against the current value. A new list that adds no value is written as given. A new list that adds an exclusive option becomes a list of that option alone; when it adds several, the last one wins. Otherwise a new list that adds other values and holds an exclusive option drops the exclusive options. Several exclusive options clear each other.
- Initial values, `reset()` and loaded drafts are not changed. A list with an exclusive option and any other value, including a second exclusive option, fails the type check with the `exclusive` message, in `validate()` and in `validateSubmission()`. `validateSubmission()` leaves it out of the returned values like any value that fails its type check. The server never picks one for the user.
- One exclusive option alone is an answer: it satisfies `required`, and `minLength` does not apply to it. `maxLength`, `contains`, `notContains` and `notEmpty` work as for any list.
- The built-in renderers show the [`or` label](#message-and-label-catalogs) before the first exclusive option that follows a non-exclusive one. The options stay native checkboxes. In a section with `layout: "matrix"` the divider is hidden.
- `exclusive` is ignored on other field types and on a field with `optionsFrom`, which reports `exclusive-not-applicable`. An exclusive option followed by a non-exclusive one is an `exclusive-option-position` warning, a `defaultValue` with an exclusive option and other values is `exclusive-default-value`, and `minLength` greater than 1 is `exclusive-with-min-length`.

## Sections

A section is a node with `type: "section"`. It groups fields under a title and shares its conditions with them.

```json
{
  "formatVersion": "1.1",
  "id": "order",
  "title": "Order",
  "submit": { "label": "Order" },
  "fields": [
    { "key": "invoice", "type": "checkbox", "label": "I need an invoice" },
    {
      "key": "billing", "type": "section", "title": "Billing address", "description": "Where we send invoices",
      "show": [{ "field": "invoice", "eq": true }],
      "fields": [
        { "key": "street", "type": "text", "label": "Street", "validation": { "required": true } },
        { "key": "city", "type": "text", "label": "City" }
      ]
    }
  ]
}
```

| Property | Type | Meaning |
|---|---|---|
| `key` | string, required | Section identifier for translations, DOM ids and editors. Unique among field and section keys. |
| `type` | `"section"`, required | |
| `title` | string, required | Section heading. |
| `description` | string | Text below the heading. |
| `show`, `showAny` | [condition](#conditions)[] | Section visibility. |
| `layout` | `"matrix"` | Draws the section as a [matrix](#matrix). Added in 1.3. |
| `fields` | (field or group)[], required | Fields and groups of the section. MAY be empty. |
| `i18n` | object | [Translation keys](#translation-keys) for `title` and `description`. |

A section holds no value. A condition that names a section key is an `unknown-field` error. A section MAY appear in `step.fields` and in single-step `fields`, and never spans steps. A section MUST NOT contain another section.

A field inside a section is visible when the conditions of the section and its own conditions pass. Section conditions follow the rules of field conditions. A section condition on a field inside the same section is a `condition-cycle` error. When a section is hidden, its fields and groups are cleared like fields hidden by their own conditions.

Fields inside a section keep their keys. The [submit payload](#submit-payload) does not change when a field moves into or out of a section.

A section MAY have an empty `fields` array. It then shows only its title and description, as a statement between questions.

### Matrix

`layout: "matrix"` draws a section as a grid, also called a Likert table. Each field of the section is a row, and the options of the first field are the column headers. Use `radio` rows, or `multiselect` rows for several answers per row, with the same options in the same order. Values stay flat: each row writes its own key, and conditions, rules and the payload treat a row like any other field. Do not set `autoAdvance` on a row: answering one row would leave the step. A renderer that does not know `layout` draws a plain section of the same fields.

```json
{
  "formatVersion": "1.3",
  "id": "pulse",
  "title": "Team pulse",
  "submit": { "label": "Send" },
  "fields": [
    {
      "key": "agree", "type": "section", "layout": "matrix", "title": "How much do you agree?",
      "fields": [
        {
          "key": "goals", "type": "radio", "label": "The goals of my team are clear", "validation": { "required": true },
          "options": [{ "value": "1", "label": "Disagree" }, { "value": "2", "label": "Neutral" }, { "value": "3", "label": "Agree" }]
        },
        {
          "key": "heard", "type": "radio", "label": "My opinion is heard",
          "options": [{ "value": "1", "label": "Disagree" }, { "value": "2", "label": "Neutral" }, { "value": "3", "label": "Agree" }]
        }
      ]
    }
  ]
}
```

## Groups

A group is a node with `type: "group"`. Its value is an array of items. Each item is an object keyed by the keys of the group `fields`.

```json
{
  "formatVersion": "1.1",
  "id": "registration",
  "title": "Registration",
  "submit": { "label": "Register" },
  "fields": [
    {
      "key": "participants", "type": "group", "label": "Participants",
      "itemLabel": "Participant {index}", "addLabel": "Add participant", "removeLabel": "Remove",
      "defaultItems": 1,
      "validation": { "required": true, "maxLength": 5 },
      "fields": [
        { "key": "name", "type": "text", "label": "Name", "validation": { "required": true } },
        { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } },
        { "key": "diet", "type": "select", "label": "Diet", "options": [{ "value": "none", "label": "None" }, { "value": "other", "label": "Other" }] },
        { "key": "dietNote", "type": "text", "label": "Details", "show": [{ "field": "diet", "eq": "other" }] }
      ]
    }
  ]
}
```

| Property | Type | Meaning |
|---|---|---|
| `key` | string, required | Key of the item array. Unique like a field key. |
| `type` | `"group"`, required | |
| `label` | string, required | Group heading. |
| `helperText` | string | Text below the heading. |
| `itemLabel` | string | Item heading. `{index}` is the item number, starting at 1. `{label}` is the group label. Default: the `itemLabel` [label](#message-and-label-catalogs). |
| `addLabel`, `removeLabel` | string | Texts of the Add and Remove buttons. Defaults: the `addItem` and `removeItem` labels. |
| `defaultItems` | integer | Number of items the group starts with. |
| `show`, `showAny` | [condition](#conditions)[] | Group visibility. |
| `validation` | `required`, `minLength`, `maxLength`, their messages, `validator` | Item count rules. |
| `fields` | [field](#fields)[], required | Fields of one item. |
| `i18n` | object | [Translation keys](#translation-keys) for `label`, `helperText`, `itemLabel`, `addLabel` and `removeLabel`. |

Rules:

- A group MAY appear in `step.fields`, in single-step `fields` and in a section. A group MUST NOT contain a section, another group, or a `file` or `hidden` field. The constructor throws on them (`invalid-nesting`).
- Item keys MUST be unique inside the group and MUST NOT repeat a field or section key outside it. No other key MAY start with the group key followed by `.`, because [error paths](#error-paths) use that form. The constructor throws on these (`duplicate-key`). Two groups MAY use the same item keys.
- A condition or `matchField` of an item field MAY use the other fields of the same item, evaluated per item, and fields outside the group under the rules of field conditions. A condition, `matchField` or `optionsDependsOn` outside the group MUST NOT use item fields (`group-scope`). It MAY test the group itself, such as with `notEmpty`.
- `required: true` means at least one item. `minLength` and `maxLength` count items, not characters, and use the `minItems` and `maxItems` messages. Like other rules, `minLength` does not apply to an empty group.

A new item, from `defaultItems` or Add, holds the `defaultValue` of its fields. An item in the initial values or in `reset(values)` gets the `defaultValue` of the fields it does not have, like top-level fields. Built-in renderers hide Add when the group has `maxLength` items, or 100 without `maxLength`, and hide Remove when it has `minLength` items, or 1 when `required`.

An item field hidden by its conditions is removed from its item, and its error is removed. When it is shown again and holds no value, it gets back its last value in that item, or else the value its item started with. An item starts with the values it has after the initial values or the last `reset()`, defaults included, or with the `defaultValue` of its fields when it comes from `defaultItems`, Add or Skip. Last values are kept per item, so they stay with the item when another item is removed, and removing an item forgets its own.

A hidden group is cleared like a field. A group that becomes visible again gets back its last items, with the same item ids, or else its [start value](#visibility).

`validateSubmission()` rejects a group value with more items than `maxLength` with the `maxItems` message, and a value that is not an array of plain objects, or that has more than 100 items without `maxLength`, with the `value` message. It does so before checking any item and leaves the value out of the returned values. It drops unknown item keys, runs the type checks and rules of every visible item field, and reports item errors by [path](#error-paths).

### Error paths

Editing an item field keeps the error under the group key; adding, removing or replacing items clears it. Errors of item fields use the path `<group>.<index>.<field>`, with a 0-based index, such as `participants.1.email`. Count rules and the group `validator` use the group key. `errors`, `stepErrors`, `validate()`, `setErrors()` and [server errors](#server-errors) use these paths. When an item is removed, the errors of later items move to their new index.

### Engine operations

| Method | Meaning |
|---|---|
| `addItem(key)` | Adds an item. Returns `false` at the maximum or when the group is not visible. |
| `removeItem(key, index)` | Removes an item. Returns `false` at the minimum or for an index out of range. |
| `setItemValue(key, index, field, value)` | Writes one item field. `setValue('<group>.<index>.<field>', value)` does the same. |
| `setValue(key, items)` | Replaces the whole array. |
| `items(key)` | The items of a visible group: a stable `id` for rendering and the visible item fields. |

## Conditions

A condition tests the value of one field:

| Property | Type | Matches when |
|---|---|---|
| `field` | string, required | Key of the field to test. |
| `eq` | string, number or boolean | value `===` `eq` |
| `neq` | string, number or boolean | value `!==` `neq` |
| `in` | (string or number)[] | the list contains the value |
| `notIn` | (string or number)[] | the list does not contain the value |
| `contains` | string, number or boolean | the value is an array with an item `===` `contains`. Added in 1.4 |
| `notContains` | string, number or boolean | `contains` with the same operand does not match. Added in 1.4 |
| `notEmpty` | boolean | `true`: the value is not empty |
| `gt` | number | the numeric value `>` `gt` |
| `gte` | number | the numeric value `>=` `gte` |
| `lt` | number | the numeric value `<` `lt` |
| `lte` | number | the numeric value `<=` `lte` |

A condition MUST use exactly one operator. The constructor throws on a condition with no operator, with several operators, or with a key that is not an operator. At runtime, a condition without a known operator never matches. `notEmpty: false` always matches; `checkDefinition()` warns about it with `condition-always-true`.

Comparison is strict and without type coercion: `"1"` does not equal `1`. `in` and `notIn` test the value itself, so an array value never matches `in`. `contains` and `notContains` test the items of an array value, such as a `multiselect` answer. `contains` never matches a value that is not an array, including an unanswered field, so `notContains` matches it. `false` and `0` count as not empty for `notEmpty`. `in: []` never matches; `notIn: []` always matches.

For `gt`, `gte`, `lt` and `lte`, the numeric value is the value itself when it is a finite number, or `Number(value)` when it is a non-empty string that converts to a finite number. Any other value, including an empty one, does not match.

### Combining conditions

An object with `show` and `showAny` is visible when:

- every condition in `show` matches, and
- `showAny` is absent or empty, or at least one of its conditions matches.

An empty `show` array always passes. An empty `showAny` array is treated as absent. The same rule applies to steps and routes.

## Visibility

Every condition sees the **active projection**: the values of visible fields on the steps of the [active path](#active-path) before the current one, plus the values of its own step. Field, step, route and action conditions use the same rule, with or without routes. In a single-step form, the projection is the values of the visible fields.

A field condition MUST reference a field of the same or an earlier step. A step condition MUST reference a field of an earlier step. The constructor throws on a condition that references a later step or a key that is not a field key. Values for keys that are not field keys, such as extra initial values, are never in the projection.

A field is visible when its own conditions pass, the conditions of its section pass and, in a multi-step form, its step is on the active path. An item field is visible when its group is visible and its conditions pass against the active projection plus the values of its own item.

Core clears the value of a field hidden by conditions. The key is removed from `engine.values` and its error is removed. Clearing runs when the engine is constructed, after `reset()` and `replaceDefinition()`, after every `setValue()` and after Skip, so a value written to a field hidden by conditions is cleared at once. It cascades: if a cleared value hides another field or step, that value is cleared too. Every field of a step hidden by its own conditions is cleared.

A field that becomes visible and holds no value gets back its **last value**: the value it held when it was hidden, or the last value written to it while hidden. `''`, `null`, `false` and `undefined` are last values too, so an unchecked preselected checkbox comes back unchecked and a cleared field comes back cleared.

A field without a last value gets its **start value**: its value in the initial values of the constructor or the last `reset()`, or else its `defaultValue`. This covers a field that starts hidden, such as a field on a step shown by an earlier answer. A restored value can show or hide other fields, which are then updated in the same way.

Last values live in the engine. `reset()` and `replaceDefinition()` forget them, and Skip forgets those of the step it resets. A new engine, such as one that reopens a draft through `initialValues`, starts without them.

A field of type `hidden` always gets back its start value, never its last value. Its start value also includes its resolved source, after the initial values and before `defaultValue`.

In a form with [routes](#routes), fields on steps that are off the active path keep their values. See [Routes](#routes).

Fields hidden by conditions are not validated and not submitted. For groups, see [Groups](#groups).

## Defaults and initial values

When the engine is constructed or reset, values are built in this order:

1. `defaultValue` of every field that has one.
2. The initial values passed to `new FormEngine(definition, initialValues)` or `reset(values)`. They override defaults.
3. Fields hidden by conditions are cleared. They keep the result of steps 1 and 2 as their start value and get it back when they are shown. See [Visibility](#visibility).

An initial value of `null` or `''` is a start value too, so the field does not fall back to `defaultValue`.

Initial values for keys that do not belong to any field stay in `engine.values` but are not submitted.

## Replacing the definition

`engine.replaceDefinition(definition)` switches a running form to a new definition and keeps the answers that still fit. The renderers call it when the `definition` prop changes and `keepValues` is set. Without `keepValues`, a new definition object still starts a new form.

1. The new definition is checked like in the constructor. On an error, `replaceDefinition()` throws `FormDefinitionError` and the engine stays unchanged.
2. A value is kept when a field with the same key and the same `type` exists in both definitions. Values of fields whose `type` changed, of removed fields and of keys that belong to no field are dropped.
3. Values are then built as on construction, with the kept values as initial values: new fields get their `defaultValue` or `defaultItems`, kept group items keep their ids and the values of item fields with the same key and `type`, other item fields get their `defaultValue`, and fields hidden by conditions are cleared. Kept values are start values. Last values from before the replacement are forgotten.
4. A field error or server error stays when its field is visible on the new active path and its `type` did not change. An item field error also needs the item field to keep its key and `type`, and follows the rules of [Groups](#groups). Form-level errors stay.
5. The current step stays when its id is on the new active path, at its new position. Otherwise core moves to the nearest earlier step of the old path that is on the new path, or to the first step. Steps inserted before the current step do not move it. Submit validates them and opens the first step with an error.
6. A skipped step stays skipped while the new definition has a step with its id. Its fields are the fields of the new step.
7. Pending navigation and pre-submit results are discarded, as with `cancelPendingActions()`. A response to a submission already sent is ignored. See [Concurrent submissions](#concurrent-submissions).
8. After `start()`, the engine reports `step_viewed` when the current step changes, and `field_shown` or `field_hidden` for conditional fields of both definitions whose visibility changed. It does not report `form_reset`.

## Validation

`validation` holds these rules:

| Rule | Type | Applies to | Default message |
|---|---|---|---|
| `required` | boolean or string | any value | `This field is required` |
| `minLength` | number | string length; item count of a `multiselect` or a group | `Minimum length is N`; `At least N required` for arrays |
| `maxLength` | number | string length; item count of a `multiselect` or a group | `Maximum length is N`; `At most N allowed` for arrays |
| `min` | number | number values; the range of a `scale`; the lowest rating of a `rating` | `Must be at least N` |
| `max` | number | number values; the range of a `scale` or `rating` | `Must be at most N` |
| `pattern` | string | `String(value)` | `Invalid format` |
| `matchField` | string | any value | `Fields must match` |
| `validator` | string | any value | message returned by the validator |

Each rule except `required` and `validator` has a matching message property: `minLengthMessage`, `maxLengthMessage`, `minMessage`, `maxMessage`, `patternMessage`, `matchFieldMessage`. A string `required` is its own message. Without one, the message comes from the [catalogs](#message-and-label-catalogs).

Core evaluates one field as follows and returns the first error:

1. If the value is empty, return the `required` error when `required` is `true` or a non-empty string. Otherwise, return the `matchField` error when the named field has a non-empty value, or no error. No other rule runs. For validation, empty also includes `false` for `checkbox` and `switch`.
2. The type check for built-in types other than `file`: `email` with a top-level domain and at most 254 characters, `date` as a real calendar date `YYYY-MM-DD`, `datetime` as `YYYY-MM-DDTHH:mm` with optional seconds and a real calendar date, `time` as 24-hour `HH:mm` with optional seconds from `00:00` to `23:59:59`, a finite number for `number`, an integer of the [range](#scale-and-rating) for `scale` and `rating`, a boolean for `checkbox` and `switch`, a static option value for `select`, `radio` and `multiselect` without `optionsFrom`, an array without repeated values and without an [exclusive option](#exclusive-options) next to other values for `multiselect`, and at most 10,000 characters (or `maxLength`) for strings. Custom types skip it.
3. For a string or array: `minLength`, then `maxLength`. For a number: `min`, then `max`. Other value types skip these rules. A numeric string is not converted.
4. `pattern`, compiled with `new RegExp(pattern)` without flags and without implicit anchors. An invalid pattern is a definition error, so the constructor throws on it. A value longer than 10,000 characters fails `pattern` without being matched.
5. `matchField`: the value is compared with `===` to the value of the named field. A field on a skipped step has no value here. In a form with routes, a field off the active path has no value either.
6. `validator`: the named function from the `validators` option is called with the value and the values that `matchField` uses. A non-empty string result is the error; `null` or `''` is no error, and `validateField()` returns `null` for both. An unregistered name is ignored at runtime, and the constructor logs a warning for it. The validator never receives an empty value, because step 1 returns first.

Validation runs on Continue for the visible fields of the current step, and on Submit for the visible fields of every non-skipped step on the active path. A group runs its count rules first, then the rules of the visible fields of every item, with the values of the same item in place of `matchField` and validator values. Renderers do not validate on blur. When Submit fails validation, the engine moves to the earliest step with an error. Like `setErrors()`, this move does not run the step change hooks. Built-in renderers focus the first invalid field after a failed Continue or Submit.

## Steps

| Property | Type | Meaning |
|---|---|---|
| `id` | string, required | Step identifier. |
| `title` | string, required | Step heading. |
| `description` | string | Text below the heading. |
| `fields` | [node](#conventions)[], required | Fields, sections and groups of the step. |
| `show`, `showAny` | [condition](#conditions)[] | Step visibility. |
| `routes` | [route](#routes)[] | Ordered forward destinations. |
| `next` | [action](#actions) or `false` | Continue action. |
| `back` | [action](#actions) or `false` | Back action. |
| `skip` | [action](#actions) | Skip action. See [Skip](#skip). |
| `i18n` | object | [Translation keys](#translation-keys) for `title` and `description`. |

Step ids MUST be unique. The constructor throws on duplicates.

A step MAY have an empty `fields` array. It then shows only its title, description and actions, as a welcome screen or a statement. Set `next` to label its button, such as `{ "label": "Start" }`. Continue on it always succeeds. It counts toward progress, so a welcome step makes "Step 1 of N" one step longer.

```json
{
  "formatVersion": "1.3",
  "id": "welcome",
  "title": "Feedback",
  "submit": { "label": "Send" },
  "steps": [
    { "id": "intro", "title": "Tell us about your stay", "description": "It takes two minutes.", "fields": [], "next": { "label": "Start" } },
    { "id": "rate", "title": "Your rating", "fields": [{ "key": "stars", "type": "rating", "label": "Rate your stay", "autoAdvance": true }] },
    { "id": "comment", "title": "Anything else?", "fields": [{ "key": "comment", "type": "textarea", "label": "Comment" }] }
  ]
}
```

A step hidden by conditions is left out of navigation, progress, validation and submission, and its field values are cleared.

Step `show`/`showAny` MUST reference fields of earlier steps. A step condition sees only the values of earlier steps on the path.

## Actions

An action is an object:

| Property | Type | Meaning |
|---|---|---|
| `label` | string, required | Button text. |
| `variant` | `primary`, `secondary`, `text` | Button style. |
| `disabled` | [condition](#conditions)[] | Disabled when all conditions match. |
| `i18n` | object | [Translation key](#translation-keys) for `label`. |

The five action slots are:

- `submit` replaces Continue on the last step of the active path, and is the only primary action of a single-step form.
- `next` sets the Continue label. `next: false` hides Continue on that step. It does not block navigation, and it never hides Submit on the last step. Renderers do not show Skip on a step with `next: false`.
- `back` sets the Back label. `back: false` hides Back. Back never appears on the first step.
- `skip` shows a Skip action on that step.
- `cancel` shows a Cancel action that calls the renderer's cancel handler. Core has no cancel operation.

Built-in renderers draw Continue and Submit as primary, Back as secondary, and Skip and Cancel as text buttons. `variant` changes the style of `back`, `skip` and `cancel`; built-in renderers ignore it on `submit` and `next`. Built-in renderers evaluate `disabled` on `submit` and on `next`, against `getSubmitValues()`. They ignore `disabled` on `back`, `skip` and `cancel`, and `checkDefinition()` warns about it with `disabled-not-applicable`. Values of fields off the active path and of skipped steps do not count. An empty `disabled` array never disables. Default labels are `Continue`, `Back`, `Skip` and `Submit`. The `continue` and `back` [labels](#message-and-label-catalogs) replace the Continue and Back defaults. In built-in renderers, Enter in a single-line input runs the primary action.

## Routes

A route is `{ "to": string | null, "show"?: condition[], "showAny"?: condition[] }`. Routing is enabled for the whole form when at least one step has a non-empty `routes` array. Without routes, the active path is every visible step in declaration order.

Rules enforced by the constructor:

- `to` MUST be the id of a later declared step, or `null`. Unknown, self and backward targets throw. Because every target is a later step, routes cannot form cycles.
- Route conditions MUST reference fields of the same step or an earlier step.

Route selection on a step:

1. Routes are tried in order. A route matches when its conditions pass and its target step is visible. A route to a step hidden by conditions is passed over.
2. The first match wins. A route without conditions always matches, so it serves as a fallback when it is last.
3. A matching `to: null` makes this step the last step of the path. Submit appears there. It does not submit the form.
4. If no route matches, the path continues with the next declared step.

Branches converge only through routes. A branch step without an exit route falls through to the next declared step, which may be a sibling branch. `checkDefinition()` warns when a route target has no unconditional route and the next declared step is another target of the same step.

### Active path

Core computes the active path from the first declared step, with or without routes:

1. Start with an empty set of path values.
2. A step whose `show`/`showAny` fails against the path values of earlier steps is passed over and the next declared step is tried.
3. A visible step joins the path. Its visible fields with defined values are added to the path values. Field conditions in that step see the earlier path values and every value of the same step.
4. The next step comes from [route selection](#routes), evaluated against the path values. Without routes, it is the next declared step.

The path values are the **active projection**. Route conditions, step conditions, field visibility, action `disabled`, validation, lifecycle hooks and submission use the active projection, not `engine.values`. Values of fields on steps off the path stay in `engine.values`, so returning to a branch restores them, but they cannot select a route or enter the payload.

When a value change removes the current step from the path, core moves to the nearest earlier step of the old path that is still on the new path. Back moves to the previous step of the current path.

## Skip

Skip on a step with `skip` (`skip()` returns `false` on a step without it):

1. Resets the step's fields to their `defaultValue`, or removes them when there is none, and removes their errors. Fields hidden by conditions are cleared after the reset, so a default of a field that the reset values hide is removed too. The `defaultValue` becomes the field's start value and its last value is forgotten (see [Visibility](#visibility)). When the submit of a final-step Skip is rejected, the values, start values and last values of the step come back.
2. Marks the step as skipped and moves to the next step of the path computed from the reset values. Skip does not run field validation or `onStepValidate`. `skip()` runs `onBeforeStepChange` and `onAfterStepChange` with `reason: 'skip'`; `false` from the before-hook cancels the skip and changes nothing.
3. A skipped step is excluded from submit validation. Its fields are excluded from the payload and from the values that validation and lifecycle hooks receive.

On the last step, `skip(submit)` submits the form without that step and runs the submit hooks. Built-in renderers pass their submit handler, so their Skip submits. `skip()` without a handler returns `false` there. Continue or Submit on a skipped step, or a changed value of one of its fields, includes it again. `checkDefinition()` warns about `skip` on a step with `next: false` or in a form with one step.

## Trimming

Core trims leading and trailing whitespace from string values of every built-in type except `password`, `number`, `scale`, `rating`, `select`, `radio` and `file`.

- `engine.values` keep the raw text as typed.
- `getSubmitValues()` and the submit payload hold the trimmed text.
- Validation runs on the trimmed text, so `required` fails on a whitespace-only value.
- `show`, `showAny`, route conditions and action `disabled` compare trimmed values.

## Auto-advance

`autoAdvance: true` lets a renderer advance when the user commits an answer. The built-in `radio`, `scale` and `rating` commit on click, Space and Enter, and `scale` and `rating` also on a digit key; arrow keys only select. Do not set it on [matrix](#matrix) rows. Commit validates the whole current step and then moves forward. Initial values and `setValue()` never advance, and the last step never auto-submits. Other built-in types ignore `autoAdvance`. Custom fields commit through `onCommit` in React and the `commit` event in Vue.

## Answer recall

A text can show an earlier answer with a `{{key}}` token, where `key` is a top-level field key. Whitespace inside the braces is allowed: `{{ key }}`. Inside a group item, the item's own fields are also recalled by their item key, from the same item. A token key is made of characters from the Unicode categories L (letters), M (marks) and N (numbers), plus `_`, `-` and `.`, so `{{contact.email}}` recalls the field `contact.email`. Other content inside `{{ }}` is reserved: a token with `|`, `?`, `:`, `(`, `)`, `[`, `]`, `'`, `"` or whitespace inside the key, like `{{name|upper}}`, shows as written, and `checkDefinition()` warns with `recall-syntax`. `\{{` shows `{{` and starts no token. It is the only escape: a backslash before it is kept as written, so `\\{{` shows `\{{`. There are no expressions, filters or formats in the definition.

```json
{
  "formatVersion": "1.5",
  "id": "signup",
  "title": "Sign up",
  "submit": { "label": "Send" },
  "steps": [
    {
      "id": "about",
      "title": "About you",
      "fields": [
        { "key": "name", "type": "text", "label": "Name" },
        { "key": "email", "type": "email", "label": "Email", "helperText": "We write to {{name}} here" },
        {
          "key": "plan",
          "type": "radio",
          "label": "Plan",
          "options": [
            { "value": "pro", "label": "Pro" },
            { "value": "team", "label": "Team" }
          ]
        }
      ]
    },
    {
      "id": "review",
      "title": "Review",
      "description": "Check your answers: {{name}}, {{email}}, plan {{plan}}",
      "fields": [{ "key": "notes", "type": "textarea", "label": "Anything to add?" }]
    }
  ]
}
```

Tokens are resolved in the step `title` and `description`, the section `title` and `description`, the field and group `label` and `helperText`, the field `placeholder` and the group `itemLabel`. The `itemLabel` is resolved inside each item, in one pass with its `{label}` and `{index}` parameters: text that one of them inserts is never read again. Option labels, action labels, catalogs and messages show tokens as written. Recall works only with `formatVersion` 1.5 or newer.

A token is replaced with the answer of the field:

| Field | Answer |
|---|---|
| `select`, `radio`, `autocomplete` | the option label from the definition `options`; a value without one, such as a value from `optionsFrom`, as is |
| `multiselect` | the list of option labels |
| `checkbox`, `switch` | the field label when `true`, else empty |
| `number`, `scale`, `rating` | the number |
| `date`, `time`, `datetime`, text types, `hidden` | the value as stored |
| `file` | the list of file names |
| group | the number of items |

A field without a value, an empty list, a field that conditions hide, a field on a step off the [active path](#active-path) or a skipped step, and an unknown key give an empty text. Each recalled text is cut to 10000 code units. Recall runs once: a recalled value that holds `{{key}}` is not expanded again. The result is plain text, and renderers draw it as text, never as HTML. React and Vue update the texts when a value, `lang` or `formatRecall` changes. `recallText(definition, text, values, { item?, lang?, format? })` from `@formhaus/core` resolves a text with the values from `engine.getSubmitValues()`; `item` is `{ group, index }` for a text inside a group item.

An optional answer can be empty, so `{{street}}, {{city}}` can show `, Springfield`. Put each optional recall on its own line or in its own text instead of joining answers with punctuation.

### Recall formatting

Each answer that is not empty goes through one formatter, `(value, field, locale) => string`. `value` is a text, a number or a list of texts, as the table above gives it. Apps replace the formatter with the `formatRecall` option of the engine and the renderers. The locale is the `lang` option of the engine or renderer, then the definition `lang`, then `en`. An overlay carries no locale: the app that applies it passes `lang`, to the renderer or to `localize()`.

The identity formatter writes a text as is, a number as JavaScript `String()` writes it (`0` for `-0`, `1e+21`, `0.30000000000000004`) and a list joined with `, `. The [conformance corpus](https://github.com/formhaus-dev/formhaus/tree/main/packages/core/fixtures/conformance) checks recall with it. Per-submission texts outside a form, such as emails, webhooks and PDFs, resolve with the values of that submission and the identity semantics. Texts that stand for many submissions, such as CSV headers and statistics, use `recallStatic(definition, text, group?)`: it replaces each token with the label of its field, the key for a field without a label, and an empty text for an unknown key. With `group`, item keys of that group are read first, as inside an item.

The default formatter uses the platform formatters, so the exact text depends on the platform and its locale data:

| Answer | `@formhaus/core` | Swift |
|---|---|---|
| `date` | `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })` | `Date.FormatStyle(date: .abbreviated, time: .omitted)` in UTC |
| `time` | `Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'UTC' })` | `Date.FormatStyle(date: .omitted, time: .shortened)` in UTC |
| `datetime` | `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })` | `Date.FormatStyle(date: .abbreviated, time: .shortened)` in UTC |
| number | `Intl.NumberFormat(locale, { maximumSignificantDigits: 21 })` | `.number.precision(.significantDigits(1...21))` |
| list | `Intl.ListFormat(locale, { type: 'conjunction' })` | `.list(type: .and, width: .standard)` |
| text | as is | as is |

Numbers are formatted only for `number`, `scale`, `rating` and the item count of a group, and `-0` shows as `0`. A number that JavaScript writes with an exponent, below `1e-6` or from `1e21`, and a number in any other field show as the identity formatter writes it, so no digit is lost. A date or time is formatted only when it passes the type check of its field. A stored date or time shows the day and clock as written: it is read in UTC and formatted in UTC, and an offset in a `datetime` is ignored, so `2027-06-14` never shows as the 13th. Runs of whitespace in a text or list item collapse to one space. A value that does not parse as its type, or an impossible date such as `2027-02-30`, shows as the identity formatter writes it. A malformed locale or one the platform does not support falls back to `en`.

The token grammar, the slots, the answer table, the identity formatter and the formatter signature are fixed for format 1.x. The default styles are platform-native and can change in a 1.x release.

Translations keep the tokens. Recall resolves the translated text, and option labels come from the translated definition. `translationIssues()` reports a translation that drops or adds a `{{key}}` token in `placeholderMismatch`.

## Submit payload

`getSubmitValues()` and the submit handler receive an object with:

- every visible field with a value other than `undefined`, on every step of the active path, or every visible field of a single-step form;
- `null`, `''`, `false` and `[]` values included;
- fields of skipped steps, fields hidden by conditions, fields off the active path and keys that are not field keys excluded.

Keys are field keys as written. The payload is not nested and not type-converted. Section fields are top-level keys. A group value is an array of item objects: each holds the visible item fields with a value other than `undefined`, trimmed like top-level values, and no other keys.

With the built-in renderers, a visible field on the active path has these payload values:

| Field state | Payload |
|---|---|
| Untouched | its [start value](#visibility), or key absent without one |
| Text cleared by the user | `""` |
| `number` cleared by the user | `null` |
| `checkbox` or `switch` unchecked by the user | `false` |
| `file` cleared by the user | `null` |

Fields hidden by conditions, on a skipped step or off the active path are absent. These are value representations, not a record of what the user did. An untouched field with an initial value of `null` sends `null`. An edit flow must not read an absent key as "keep the stored value". `validateSubmission()` reads an absent key as absent too: it applies no `defaultValue`, `defaultItems` or item field default to it, and it keeps no last values, so it restores nothing that the payload does not hold. It resets the fields of each step in `skippedSteps` like Skip does, ignores the values sent for them and evaluates conditions against the reset values. A value that fails its type check, at top level or in a group item, gets only its type error and is left out of the returned values; conditions and validators treat the field as unanswered. `""` and `null` count as empty for `required`, and `notEmpty` does not match them.

Reopening a draft through `initialValues` starts without last values, so a hidden field the draft omits gets its `defaultValue` when it is shown.

A `file` value in the browser is a `File`, or `null` after clearing. Core does not upload it, and how it reaches the server is the app's choice, such as `FormData` or an uploader that returns a reference. `validateSubmission()` on the server checks a `file` value as a string reference.

## Submit results

The submit handler receives the [submit payload](#submit-payload) and the skipped step ids. It MAY return a result, directly or through a Promise:

```ts
type SubmitResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; formErrors?: string[] }
```

| Handler outcome | `submit()` resolves | Values | Errors | `onAfterSubmit` |
|---|---|---|---|---|
| `{ ok: true }`, `undefined` or any value other than a rejection | `true` | Kept | Cleared | Runs once |
| A rejection: a plain object with `ok: false` | `false` | Kept | Replaced by the result | Does not run |
| Throws or rejects | Rejects with the same error | Kept | Unchanged | Does not run |

A plain object is one whose prototype is `Object.prototype`. A `fetch` `Response` with `ok: false` is not a rejection, so a handler that returned it still counts as a success.

### Server errors

`errors` keys are field keys or [item paths](#error-paths). An item path refers to the items as they were sent; errors of a group whose value changed during the request are dropped. A message that is not a string is ignored; an array of strings is joined with spaces. `formErrors` other than an array of strings is ignored. A rejection and `setErrors(errors)` apply a server error set the same way:

1. A key of a visible field on the active path, or the path of a visible item field of an existing item, becomes the error of that field. Every other key, including the key of a field hidden by its conditions or a field off the active path, becomes a form-level error. An error on a field of type `hidden` stays under its key and is also listed in `topLevelErrors`. Form-level errors are the `formErrors` messages, then the unmatched messages in key order. They are exposed as `topLevelErrors`.
2. The set replaces all previous field errors and form-level errors at once.
3. In a multi-step form, the engine opens the earliest step on the active path that has a field error. The key order of `errors` does not matter. The step change hooks do not run.
4. The built-in renderers focus the first invalid field on that step after it renders: the checked option of a group, or its first enabled control.

Field errors are kept until one of these events:

| Event | Server field errors | Form-level errors |
|---|---|---|
| The field gets a different value | That field's error is removed | Kept |
| The field is hidden by conditions, its step leaves the active path, or its step is skipped | That field's error is removed | Kept |
| `validateField(key)` finds no client error | That field's error is removed | Kept |
| Navigation, Continue, `validate()` and `onStepValidate` errors | Kept | Kept |
| A new submission is sent | Kept while it runs | Kept while it runs |
| A rejection or `setErrors()` | Replaced | Replaced |
| A successful submission or `reset()` | Removed, unless `setErrors()` ran during the request | Removed, unless `setErrors()` ran during the request |

Writing the same value again keeps the error. While a client rule fails on a field with a server error, the client error shows; the server error returns when the client error is resolved. Server errors do not block Continue or Submit. Client rules decide whether the request is sent.

### Concurrent submissions

- One action runs at a time. `submit()` and `skip()` while a submission or navigation is pending resolve to `false` without calling the handler.
- A response that arrives after `reset()`, `cancelPendingActions()`, a definition change or an unmount is ignored. It applies no errors, does not navigate and does not run `onAfterSubmit`. `submit()` still resolves to `true` for a success and `false` for a rejection.
- The built-in renderers disable fields while a submission runs. When the engine is driven directly and a value changes during the request, a success still runs `onAfterSubmit` with the values that were sent. A rejection skips the errors of fields whose value changed after the request was sent.
- The engine does not abort a request. A handler that needs to abort uses its own `AbortController`.

## Translations

A definition holds its texts in one language, the source language. Catalogs, translation keys and overlays change texts only. They never change fields, rules, routes or the submit payload.

### Message and label catalogs

`messages` replaces the built-in validation messages and `labels` the built-in renderer texts. Values are templates: `{name}` is replaced by the param of that name, and unknown placeholders stay as they are. Core skips a value that is not a non-empty string. `checkTranslations()` reports it as `invalid-type`.

| Message key | Default | Params |
|---|---|---|
| `required` | `This field is required` | |
| `minLength`, `maxLength` | `Minimum length is {min}`, `Maximum length is {max}` | `min`, `max` |
| `minItems`, `maxItems` | `At least {min} required`, `At most {max} allowed` | `min`, `max` |
| `min`, `max` | `Must be at least {min}`, `Must be at most {max}` | `min`, `max` |
| `pattern` | `Invalid format` | |
| `matchField` | `Fields must match` | |
| `email` | `Enter a valid email` | |
| `number` | `Enter a number` | |
| `date` | `Enter a valid date` | |
| `datetime` | `Enter a valid date and time` | |
| `time` | `Enter a valid time` | |
| `option` | `Select one of the available options` | |
| `options` | `Must be a list of available options` | |
| `exclusive` | `Select "{option}" or other options, not both` | `option` (the label of the exclusive option) |
| `boolean` | `Must be true or false` | |
| `string` | `Must be text` | |
| `file` | `Must be a file reference` | |
| `value` | `Invalid value` | |
| `hidden` | `{label}: {message}` | `label`, `message` |

`minLength` and `maxLength` on an array value, including a group, use `minItems` and `maxItems`. The 10,000-character limit of the type check uses `maxLength`. A `multiselect` value that is not an array or repeats a value fails with `options`, and one that holds an exclusive option with other values fails with `exclusive`; an item that is not a static option fails with `option`.

| Label key | Default | Params |
|---|---|---|
| `continue` | `Continue` | |
| `back` | `Back` | |
| `stepOf` | `Step {current} of {total}` | `current`, `total` |
| `errorSummary` | `Check these answers` | |
| `addItem` | `Add` | |
| `removeItem` | `Remove` | |
| `itemLabel` | `{label} {index}` | `label`, `index` |
| `itemAdded` | `{item} added` | `item` |
| `itemRemoved` | `{item} removed` | `item` |
| `removeItemNamed` | `{label} {item}` | `label` (the Remove text), `item` |
| `removeItemPrompt` | `Remove {item}?` | `item` |
| `removeItemBody` | `This removes {item} and its answers. This cannot be undone.` | `item` |
| `cancel` | `Cancel` | |
| `enlargeImage` | `Enlarge image: {label}` | `label` (the option label) |
| `close` | `Close` | |
| `clear` | `Clear` | |
| `done` | `Done` | |
| `chooseFile` | `Choose file` | |
| `required` | `required` | |
| `skip` | `Skip` | |
| `submit` | `Submit` | |
| `stepTitle` | `Step {index}` | `index` (1-based) |
| `stepErrors` | `Errors: {count}` | `count` |
| `or` | `or` | |
| `select` | `Select` | |

A message for a failed rule comes from the first of:

1. The field message: a string `required`, `minLengthMessage`, `maxLengthMessage`, `minMessage`, `maxMessage`, `patternMessage` or `matchFieldMessage`.
2. The `messages` option of the engine, the renderer or `validateSubmission()`.
3. `definition.messages`.
4. The default.

A label comes from the explicit action label, then the `labels` renderer option, then `definition.labels`, then the default. `skip` and `submit` apply when the step `skip` or the form `submit` has no label. `stepTitle` names a step without a title in the step progress, and `stepErrors` marks a step with errors there. `or` is the divider before [exclusive options](#exclusive-options). `select` is the prompt of an empty select. `clear` names the button that clears a field, `done` the button that confirms a date or time picker, and `chooseFile` the button that opens the file picker. `required` is the word assistive technology announces for a required field. Web renderers use `aria-required` and the browser file input, so they do not show `clear`, `done`, `chooseFile`, `required` or `select`. A `messages` or `labels` option MAY be a function `(key, params, field)` or `(key, params)`. Its result is final text and is not formatted again. `undefined` or `''` falls through to the next source.

Core resolves a message when the rule fails. Errors stay strings. The `messages` option is fixed for the lifetime of an engine.

### Translation keys

An `i18n` object maps texts of its node to keys of the app dictionary, such as Lokalise keys:

| Node | Slots |
|---|---|
| definition | `title`, `description`, `messages.<key>`, `labels.<key>` |
| step, section | `title`, `description` |
| field | `label`, `placeholder`, `helperText` |
| group | `label`, `helperText`, `itemLabel`, `addLabel`, `removeLabel` |
| option, action | `label` |
| validation | `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `matchField` |

The text of a bound slot MUST exist in the node; it is the fallback wherever the app dictionary is not available. A key without its text is an `i18n-unbound-slot` error. A validation slot MAY bind a rule without a field message. `FormEngine` ignores `i18n`; `localize()` from `@formhaus/core/i18n` reads it and throws a `FormDefinitionError` on translation errors.

```json
{
  "id": "signup",
  "title": "Sign up",
  "submit": { "label": "Create account", "i18n": { "label": "signup.submit" } },
  "fields": [
    {
      "key": "email", "type": "email", "label": "Email",
      "i18n": { "label": "signup.email.label" },
      "validation": { "required": "Enter your email", "i18n": { "required": "errors.emailRequired" } }
    }
  ]
}
```

### Addresses

An address names a text slot by identifiers, never by array index:

```text
title | description
submit.label | cancel.label
messages.<key> | labels.<key>
fields.<key>.label | placeholder | helperText
fields.<key>.options.<value>
fields.<key>.validation.<rule>
steps.<id>.title | description
steps.<id>.next.label | back.label | skip.label
steps.<id>.fields.<key>.label | ...
sections.<key>.title | description
steps.<id>.sections.<key>.title | description
fields.<group>.label | helperText | itemLabel | addLabel | removeLabel
fields.<group>.fields.<key>.label | ...
```

Fields of a multi-step form are addressed under their step, so a key shared by two exclusive route branches has one address per branch. Fields of a section keep the address they have outside it. Item fields are addressed under their group. `{index}` in an `itemLabel` is a placeholder, so a translation MUST keep it.

### Overlays

An overlay is a JSON object of translated texts, nested by address. Every leaf is a string. Its JSON Schema is [`https://formhaus.dev/schema/form-translation.json`](https://formhaus.dev/schema/form-translation.json), shipped as `@formhaus/core/translation.schema.json`.

```json [signup.ru.json]
{
  "title": "Регистрация",
  "submit": { "label": "Создать аккаунт" },
  "messages": { "required": "Обязательное поле", "minLength": "Минимум {min} символов" },
  "labels": { "stepOf": "Шаг {current} из {total}" },
  "fields": {
    "email": { "label": "Почта", "validation": { "required": "Укажите почту" } }
  }
}
```

`localize(definition, { overlay })` returns a copy of the definition:

- A text is replaced only by a non-empty string. Missing, empty and non-string entries keep the source text.
- Entries without a source slot are ignored. An overlay never adds fields, options, rules or actions.
- A validation entry applies only when its rule is set. It becomes the field message, with `{min}` and `{max}` replaced by the rule value. Field messages in the definition itself are used as written.
- `messages` and `labels` entries are merged into the definition catalogs.
- Only own properties are read.

### Translate function

`localize(definition, { translate, prefix })` calls `translate(key, params, defaultText)` for each slot. The key is the explicit `i18n` key, or `<prefix>.<address>`, where `prefix` defaults to the form id. With `prefix: false` only explicit keys are asked. A result of `undefined`, `''` or the key itself, or a thrown error, means no translation, and the source text stays. `{name}` placeholders left in a result are filled in like overlay templates.

Texts, options, action labels and field messages are translated once. For a rule without a field message, a result equal to `defaultText` is not written, so the catalog still applies. Catalog messages and labels are translated when they are shown, through the `messages` and `labels` functions that `localize()` returns.

`lang` is metadata. It does not select a translation and does not set `dir`.

## Definition checks

`checkDefinition(definition)` never throws. It returns a list of issues. Each issue has a `code`, a `severity` (`error` or `warning`), a JSON pointer `path` to the node, a `message` of the form `<path>: <what is wrong>. <how to fix>.`, and an optional `hint` with the fix. Errors come before warnings.

The `FormEngine` constructor runs the same checks. It throws a `FormDefinitionError` with the errors in `issues`, and passes each warning to the `onWarning` option. Without `onWarning`, it logs warnings with `console.warn`. When `process.env.NODE_ENV` is `production`, or `process` is not defined, the constructor runs only the error checks: it reports no warnings, and its errors have no typo suggestions. `validateSubmission()` does not log warnings.

| Code | Severity | Reported for |
|---|---|---|
| `invalid-type` | error | A definition that is not an object; `fields`, `steps`, `steps[].fields`, the `fields` of a section or a group, `routes`, `options`, `show`, `showAny` or `disabled` that is not an array of objects; or a property of the wrong type, such as an `id` that is not a string, `in` that is not an array, `max` that is not a number, a `source` that is not a name or a `{ "query" }` object with a parameter name, or a `formatVersion` that is not a version string |
| `unsupported-format-version` | error | A `formatVersion` with a major version newer than this core reads |
| `missing-property` | error, warning | A missing `id`, `submit`, step `id` or `fields`, field `key` or `type`, option `value`, route `to` or condition `field`. A missing form or step `title`, field or option `label`, or action `label` is a warning. The path points to the object that lacks the property |
| `unknown-property` | warning | A property the JSON Schema does not define, such as `imd` for `id`. The hint names the closest known property, or the `validation` object for a rule set on a field |
| `fields-and-steps` | error | Both `fields` and `steps` non-empty |
| `duplicate-step-id` | error | Two steps with one id |
| `reserved-key` | error | A field key that is a built-in object property name, such as `constructor` |
| `route-target` | error | A route target that is not a later declared step id or `null` |
| `unknown-field` | error, warning for `optionsDependsOn` | A condition, `matchField` or `optionsDependsOn` key that is not a field key, including a section key |
| `group-scope` | error | A condition or `matchField` outside a group that uses a field inside it, or an item field that uses a field of another group |
| `invalid-nesting` | error | A section inside a section or a group, or a group, `file` or `hidden` field inside a group |
| `forward-reference` | error | A field or route condition on a later step, or a step condition on the same or a later step |
| `condition-operator-count` | error | A condition with no operator or with several |
| `unknown-operator` | error | A condition key that is not an operator |
| `condition-cycle` | error | Show conditions that depend on each other in a cycle |
| `invalid-pattern` | error | A `pattern` that is not a valid regular expression |
| `duplicate-key` | error | A field or section key that an earlier one on a possible path already uses, an item key that repeats a key of the same group or a key outside it, or a key that starts with a group key and `.` |
| `duplicate-option-value` | error | An option value that an earlier option of the same field already uses |
| `invalid-range` | error | `minLength` greater than `maxLength`, `min` greater than `max`, `defaultItems` greater than `maxLength`, or `columns` outside 1 to 4 |
| `invalid-scale` | error | A `scale` or `rating` whose `min` or `max` is not an integer, or whose range has fewer than 2 or more than 11 points |
| `empty-label` | warning | A field other than `hidden` with an empty or blank `label` |
| `unknown-source` | error | A `source` string that is not a source name |
| `condition-value-mismatch` | warning | A condition value of the wrong type for the field, a value that is not one of its static `options`, or `eq`, `neq`, `in` or `notIn` on a `multiselect` |
| `contains-not-list` | warning | `contains` or `notContains` on a built-in field that does not hold a list, or on a group. Only `multiselect` holds a list; custom types are not checked |
| `contains-not-in-options` | warning | A `contains` or `notContains` value that is not one of the static `options` of the `multiselect` |
| `slow-pattern` | warning | A `pattern` that repeats a group with a quantifier or an alternation inside, such as `(a+)+`, which can take very long to match |
| `rule-not-applicable` | warning | `min`/`max` on a built-in type other than `number`, `scale` and `rating` or on a group, or `minLength`/`maxLength` on `number`, `scale`, `rating`, `checkbox` or `switch` |
| `condition-always-true` | warning | `notEmpty: false`, which matches every value |
| `disabled-not-applicable` | warning | `disabled` on a `back`, `skip` or `cancel` action, which the built-in renderers ignore |
| `outdated-format-version` | warning | A section or a group in a definition without `formatVersion` 1.1 or newer, a `scale` or `rating` field without 1.3, a `contains` or `notContains` condition without 1.4, a `{{key}}` token, an exclusive option or an `autocomplete` without 1.5 |
| `unknown-recall-field` | warning | A `{{key}}` token whose key is not a top-level field key or, inside a group item, an item key |
| `recall-forward-reference` | warning | A `{{key}}` token for a field on a later step, or for the field that holds the text |
| `recall-syntax` | warning | A `{{ }}` token with content other than a field key. It shows as written |
| `missing-options` | warning | `select`, `radio` or `multiselect` without `options` or `optionsFrom` |
| `default-not-in-options` | warning | A `defaultValue` that is not one of the `options` |
| `unknown-field-type` | warning | A field type that looks like a typo of a built-in type, such as `txt`. A type with `-` or `:` is reported only when it spells a built-in type with separators, such as `multi-select` |
| `custom-type-name` | warning | A custom field type without `-` or `:`, such as `stars`. Not reported when `unknown-field-type` is |
| `definition-reset` | warning, from the React and Vue renderers in development | A new `definition` object with the same content as the previous one, which resets the form |
| `missing-component` | warning, from the React and Vue renderers in development | A field type with no component in `components`. Reported once per type |
| `source-not-applicable` | warning | A `source` on a field that is not `hidden` |
| `unknown-autocomplete-token` | warning | An `autocomplete` that is not a valid [autofill token](#autocomplete) |
| `autocomplete-not-applicable` | warning | `autocomplete` on a built-in field type other than `text`, `email`, `phone`, `password`, `textarea`, `number`, `date`, `select`, `autocomplete` and `radio` |
| `columns-not-applicable` | warning | `columns` on a field whose options have no `image`, on a field other than `radio` or `multiselect`, or on a field whose parent has `layout: "matrix"` |
| `unsafe-image-url` | warning | An option `image` that does not start with `https:` or `data:image/` |
| `exclusive-not-applicable` | warning | `exclusive` on an option of a field other than `multiselect`, or of a field with `optionsFrom` |
| `exclusive-option-position` | warning | An exclusive option followed by an option that is not exclusive |
| `exclusive-default-value` | warning | A `defaultValue` that holds an exclusive option and other values |
| `exclusive-with-min-length` | warning | `minLength` greater than 1 on a `multiselect` with an exclusive option |
| `unknown-validator` | warning | A `validator` name missing from the `validators` option. Reported only when validators are passed |
| `skip-unreachable` | warning | `skip` on a step with `next: false`, or in a form with one step |
| `route-fallthrough` | warning | A branch that falls through into a sibling branch |
| `i18n-unbound-slot` | error, from `checkTranslations()` | A translation key for a text the node does not have, such as `i18n.placeholder` without `placeholder` |
| `unknown-i18n-slot` | warning, from `checkTranslations()` | An `i18n` key for a text the node cannot have, or for a rule that is not set |
| `unknown-message-key` | warning, from `checkTranslations()` | A `messages` or `i18n.messages` key that is not a message key |
| `unknown-label-key` | warning, from `checkTranslations()` | A `labels` or `i18n.labels` key that is not a label key |
| `i18n-unsafe-identifier` | warning, from `checkTranslations()` | A form id, step id, field key or option value with `.` or `:` in a definition with translation keys |

`checkTranslations(definition)` from `@formhaus/core/i18n` checks `lang`, `messages`, `labels` and `i18n`: it reports `invalid-type` for a value that is not a non-empty string and the translation codes above. `checkDefinition()` and the `FormEngine` constructor do not run it.

`parseDefinition(input)` returns the input typed as a definition, or throws a `FormDefinitionError` with the errors.

### Fixes

`@formhaus/core/fix` turns issues into repairs. The main entry does not include it.

```ts
import { applyFix, fixAll, suggestFixes } from '@formhaus/core/fix';

const issues = suggestFixes(definition);
const fixed = applyFix(definition, issues[0].fixes[0].patch);
const { definition: repaired, applied, issues: left } = fixAll(definition);
```

`suggestFixes(definition, issues?)` returns the issues of `checkDefinition()`, or the issues you pass, with `fixes` on the issues it can repair. Each fix is `{ title, safe, patch }`. `patch` is a list of [JSON Patch](https://www.rfc-editor.org/rfc/rfc6902) operations: `add`, `replace`, `remove` and `move`. A fix with `safe: true` repairs the issue and changes nothing else.

`applyFix(definition, patch)` returns a new definition and leaves the input as is. It throws when a path does not exist or the patch has an unknown operation. `fixAll(definition)` applies safe fixes until none are left, up to 500 rounds, and returns the definition, the `applied` fixes and the remaining `issues`.

| Code | Fix | Safe |
|---|---|---|
| `unknown-property` | Rename to the property in the hint, such as `imd` to `id` | yes |
| `unknown-property` on a rule set on a field | Move the rule into `validation` | no, the rule starts to apply |
| `missing-property` | Rename a misspelled property when there is one. Otherwise form or step `id` from the title (`my-form` or `step-2` without one), field `key` from the label (`field` without one), option `value` from its label, `submit` with the label `Submit`, step `fields` as an empty list | yes |
| `missing-property` for a `label` | Field and option `label` from the key or value, action `label` from the default button text | yes, except `next` and `back` labels in a definition with `labels` or `lang`, and `cancel` |
| `empty-label` | Field `label` from the key, such as `First name` for `firstName` | yes |
| `duplicate-key` | Rename the later key with `_2`, `_3` | when no condition, `matchField` or `optionsDependsOn` uses the key |
| `duplicate-option-value` | Change the later value with `_2`, `_3` | when no condition and no `defaultValue` uses the value |
| `duplicate-step-id` | Rename the later id with `-2`, `-3` | when no route targets the id |
| `invalid-type` on `formatVersion` | Set `formatVersion` to the current version | when the major version matches, such as `1` or `"v1"` |
| `unsupported-format-version` | Set `formatVersion` to the current version | no |
| `unknown-field`, `route-target` | Use the closest field key or step id the reference may point to | when it is the only name within one edit (insertion, deletion, substitution or swap of adjacent letters, ignoring case) and no other name is within two edits |
| `unknown-field-type`, `unknown-operator` | Use the closest existing name | no |
| `invalid-range` | Swap the two bounds | no |

Other codes, such as `invalid-pattern` and `condition-cycle`, have no fix.

## JSON Schema

The JSON Schema is published at [`https://formhaus.dev/schema/form-definition.json`](https://formhaus.dev/schema/form-definition.json) and ships as `@formhaus/core/schema.json`. A definition MAY set `$schema` to that URL for editor validation and completion. The schema checks shape only. Rules that depend on other parts of the definition, such as route targets, are checked by `checkDefinition()`.

Minimal single-step definition:

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "contact",
  "title": "Contact",
  "submit": { "label": "Send" },
  "fields": [
    { "key": "name", "type": "text", "label": "Name", "validation": { "required": true } }
  ]
}
```

## Complete example

This definition is normative. It uses conditions, defaults, validation, routes with convergence, `to: null`, skip and action overrides.

```json
{
  "$schema": "https://formhaus.dev/schema/form-definition.json",
  "id": "account-application",
  "title": "Open an account",
  "submit": { "label": "Open account" },
  "cancel": { "label": "Cancel", "variant": "text" },
  "steps": [
    {
      "id": "kind",
      "title": "Account type",
      "next": false,
      "back": false,
      "fields": [
        {
          "key": "accountType",
          "type": "radio",
          "label": "Account type",
          "autoAdvance": true,
          "validation": { "required": "Choose an account type" },
          "options": [
            { "value": "business", "label": "Business" },
            { "value": "personal", "label": "Personal" },
            { "value": "waitlist", "label": "Not sure yet" }
          ]
        }
      ],
      "routes": [
        { "to": null, "show": [{ "field": "accountType", "eq": "waitlist" }] },
        { "to": "business", "show": [{ "field": "accountType", "eq": "business" }] },
        { "to": "personal" }
      ]
    },
    {
      "id": "business",
      "title": "Company",
      "fields": [
        { "key": "company", "type": "text", "label": "Company name", "validation": { "required": true, "minLength": 2 } },
        {
          "key": "employees",
          "type": "number",
          "label": "Employees",
          "validation": { "min": 1, "max": 10000, "maxMessage": "Contact sales for more than 10000 employees" }
        }
      ],
      "routes": [{ "to": "contact" }]
    },
    {
      "id": "personal",
      "title": "About you",
      "fields": [
        { "key": "name", "type": "text", "label": "Full name", "validation": { "required": true } },
        { "key": "birthDate", "type": "date", "label": "Date of birth" }
      ],
      "routes": [{ "to": "contact" }]
    },
    {
      "id": "contact",
      "title": "Contact",
      "back": { "label": "Edit details" },
      "fields": [
        { "key": "channel", "type": "select", "label": "Preferred channel", "defaultValue": "email", "options": [
          { "value": "email", "label": "Email" },
          { "value": "phone", "label": "Phone" }
        ] },
        {
          "key": "email",
          "type": "email",
          "label": "Email",
          "validation": { "required": true, "pattern": "^[^@\\s]+@[^@\\s]+$", "patternMessage": "Enter a valid email" }
        },
        {
          "key": "confirmEmail",
          "type": "email",
          "label": "Confirm email",
          "validation": { "required": true, "matchField": "email", "matchFieldMessage": "Emails must match" }
        },
        {
          "key": "phone",
          "type": "phone",
          "label": "Phone",
          "inputMode": "tel",
          "show": [{ "field": "channel", "eq": "phone" }],
          "validation": { "required": true }
        },
        { "key": "terms", "type": "checkbox", "label": "I accept the terms", "validation": { "required": "Accept the terms to continue" } }
      ]
    },
    {
      "id": "newsletter",
      "title": "Newsletter",
      "skip": { "label": "Not now" },
      "fields": [
        { "key": "subscribe", "type": "switch", "label": "Send me product news", "defaultValue": false },
        {
          "key": "topics",
          "type": "multiselect",
          "label": "Topics",
          "showAny": [{ "field": "subscribe", "eq": true }],
          "validation": { "required": "Pick at least one topic" },
          "options": [
            { "value": "product", "label": "Product updates" },
            { "value": "events", "label": "Events" }
          ]
        }
      ]
    }
  ]
}
```

With `accountType: "personal"`, the active path is `kind`, `personal`, `contact`, `newsletter`. Values entered earlier on `business` stay in `engine.values` and are not submitted. With `accountType: "waitlist"`, the first route ends the path at `kind`, and Submit appears there. Skipping `newsletter` submits without `subscribe` and `topics`.
