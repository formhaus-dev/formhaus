---
title: "Sections"
description: "Group related fields under a title with shared show conditions. Fields inside a section keep their flat keys in the submitted values."
---

# Sections

A section puts fields under a title and shows or hides them together. Requires `@formhaus/core` 0.14 and `"formatVersion": "1.1"`.

```json
{
  "formatVersion": "1.1",
  "id": "order",
  "title": "Order",
  "submit": { "label": "Order" },
  "fields": [
    { "key": "invoice", "type": "checkbox", "label": "I need an invoice" },
    {
      "key": "billing",
      "type": "section",
      "title": "Billing address",
      "description": "Where we send invoices",
      "show": [{ "field": "invoice", "eq": true }],
      "fields": [
        { "key": "street", "type": "text", "label": "Street", "validation": { "required": true } },
        { "key": "city", "type": "text", "label": "City" }
      ]
    }
  ]
}
```

Submitted values stay flat:

```json
{ "invoice": true, "street": "Main St 1", "city": "Oslo" }
```

## Properties

| Property | Type | Description |
|---|---|---|
| `key` | string | Section id for translations, DOM ids and editors. Shares the namespace of field keys. |
| `type` | `"section"` | |
| `title` | string | Heading. |
| `description` | string | Text under the heading. |
| `show`, `showAny` | condition[] | Visibility of the section and everything in it. |
| `fields` | field or group[] | Fields and [groups](/guide/groups) of the section. |
| `i18n` | object | Translation keys for `title` and `description`. |

## Rules

- A section works in single-step `fields` and in `step.fields`. It never spans steps.
- Sections do not nest. A section inside a section or a group is an `invalid-nesting` error.
- A field inside a section is visible when the section conditions and its own conditions pass.
- Section conditions follow the rules of field conditions. A section condition on one of its own fields is a `condition-cycle` error.
- A hidden section clears the values and errors of its fields, like any hidden field.
- A condition cannot test a section key. It is an `unknown-field` error.
- Moving a field into or out of a section does not change the submitted values or its translation address.

## Rendering

React and Vue render a section as a fieldset:

```html
<fieldset class="fh-section" id="…-billing" aria-describedby="…-billing-description">
  <legend class="fh-section__title">Billing address</legend>
  <p id="…-billing-description" class="fh-field__helper fh-section__description">Where we send invoices</p>
  <div class="fh-section__body"><!-- fields --></div>
</fieldset>
```

Style it with `.fh-section` and `.fh-section__title`. A headless renderer reads `engine.visibleNodes`: a visible section arrives with only its visible fields. `engine.visibleFields` stays flat and lists the section fields in place.

## Custom markup

Pass `section` in `components` to own the markup:

```tsx
import type { SectionComponentProps } from '@formhaus/react';

const Section = ({ title, description, children }: SectionComponentProps) => (
  <section>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {children}
  </section>
);

<FormRenderer definition={definition} components={{ section: Section }} onSubmit={send} />;
```

It receives `id`, `section`, `title`, `description` and `descriptionId`, and the visible fields as `children` (React) or the default slot (Vue). In Vue, declare the props with `defineProps(sectionComponentProps)`. `DefaultSection` is exported for wrapping.

## Translations

Section texts live at `sections.<key>.title` and `sections.<key>.description`, or `steps.<id>.sections.<key>.…` in a multi-step form. Fields inside keep `fields.<key>.…`. See [Translations](/guide/translations).
