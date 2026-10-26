---
title: "Nested sections"
description: "Formhaus sections do not nest. Use steps for the outer level, or on one page a sibling section, a subheading field or a one-item group."
---

# How do I put a section inside a section?

A section cannot contain a section. That is an `invalid-nesting` error. Nesting is left out on purpose because few forms need it. If you do, tell us in [GitHub issues](https://github.com/formhaus-dev/formhaus/issues).

| Approach | Use it when |
|---|---|
| [Steps with sections](#steps-with-sections) | The outer level can be its own screen |
| [Sibling section](#sibling-section) | Everything stays on one page. The default |
| [Subheading field](#subheading-field) | You only need a heading inside a section |
| [One-item group](#one-item-group) | The API expects a nested object |

## Steps with sections

A step is the outer level and its sections are the inner one. A step `show` hides the whole level.

```json
{
  "formatVersion": "1.1",
  "id": "checkout",
  "title": "Checkout",
  "submit": { "label": "Continue" },
  "steps": [
    {
      "id": "delivery",
      "title": "Delivery",
      "fields": [
        {
          "key": "delivery",
          "type": "radio",
          "label": "Delivery",
          "defaultValue": "courier",
          "options": [{ "value": "courier", "label": "Courier" }, { "value": "pickup", "label": "Pickup point" }]
        }
      ]
    },
    {
      "id": "shipping",
      "title": "Shipping",
      "show": [{ "field": "delivery", "eq": "courier" }],
      "fields": [
        {
          "key": "contact",
          "type": "section",
          "title": "Recipient",
          "fields": [
            { "key": "recipient", "type": "text", "label": "Name", "validation": { "required": true } },
            { "key": "phone", "type": "phone", "label": "Phone" }
          ]
        },
        {
          "key": "address",
          "type": "section",
          "title": "Address",
          "fields": [
            { "key": "street", "type": "text", "label": "Street", "validation": { "required": true } },
            { "key": "city", "type": "text", "label": "City", "validation": { "required": true } }
          ]
        }
      ]
    }
  ]
}
```

With Pickup point selected, the Shipping step is skipped and the form submits `{ "delivery": "pickup" }`. See [Multi-step forms](/guide/steps).

The approaches below keep everything on one page.

## Sibling section

Put the inner block in its own section next to the outer one. A custom `section` component finds it by key and renders it as part of the section above.

<<< @/recipes/definitions/shipping-flat.json

```tsx
import { DefaultSection, FormRenderer, type SectionComponentProps } from '@formhaus/react';

function Section(props: SectionComponentProps) {
  if (!props.section.key.endsWith('More')) return <DefaultSection {...props} />;
  return (
    <div id={props.id} role="group" aria-label={props.title} aria-describedby={props.description ? props.descriptionId : undefined} className="subsection">
      {props.description && <p id={props.descriptionId}>{props.description}</p>}
      {props.children}
    </div>
  );
}

<FormRenderer definition={definition} layout={{ section: Section }} onSubmit={send} />;
```

- Style `.subsection` with an indent and no top margin, so it reads as part of Shipping.
- Values stay flat: `{ "delivery": "courier", "recipient": "Ada", "street": "Main St 1", "city": "Oslo" }`.
- Validation and conditions work as in any section.
- To show and hide both blocks together, give them the same `show`. The condition is written twice.
- Only the key suffix links the two sections. Core does not know about it.

## Subheading field

A custom field type with no value renders a heading between the fields of one section. It needs `props`, which requires `@formhaus/core` 0.15 and format 1.2.

<<< @/recipes/definitions/shipping-heading.json

```tsx
import { FormRenderer, type FieldComponentProps } from '@formhaus/react';

const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

function Subheading({ field }: FieldComponentProps) {
  const Heading = headings[Number(field.props?.level) - 1] ?? 'h4';
  return <Heading className="subheading">{field.label}</Heading>;
}

<FormRenderer definition={definition} components={{ 'x-subheading': Subheading }} onSubmit={send} />;
```

- A custom type name needs `-` or `:`. Without one, `checkDefinition()` warns with `custom-type-name`.
- The field never gets a value, so it is not in the submitted values. `validateSubmission()` treats it as any custom field and keeps a value a client sends under its key. Drop that key on the server before you store the submission.
- Leave out `required`. A required subheading always fails with `This field is required`.
- The heading does not wrap the fields below it. Each field needs its own `show`, as `street` and `city` do here.

## One-item group

A [group](/guide/groups) inside a section, limited to one item, is a real nested container. The value becomes an array with one object.

<<< @/recipes/definitions/shipping-group.json

<RecipePreview name="shipping-group" />

- `defaultItems: 1` starts the group with one item. Without it, the group starts empty.
- `required: true` rejects an empty group. `minLength: 1` alone does not.
- At `maxLength: 1` the renderer hides Add. With `required` it hides Remove at one item.
- Submitted values: `{ "delivery": "courier", "recipient": "Ada", "address": [{ "street": "Main St 1", "city": "Oslo" }] }`.
- Item errors use paths like `address.0.street`.

The default renderer draws the group as a fieldset with an item card, so "Address" shows twice. A `group` component renders plain markup:

```tsx
import { DefaultGroup, FormRenderer, type GroupComponentProps } from '@formhaus/react';

function Group(props: GroupComponentProps) {
  if (props.group.validation?.maxLength !== 1) return <DefaultGroup {...props} />;
  const errorId = `${props.id}-error`;
  return (
    <div
      id={props.id}
      role="group"
      aria-label={props.label}
      aria-invalid={!!props.error || undefined}
      aria-describedby={props.error ? errorId : undefined}
    >
      <h4>{props.label}</h4>
      {props.error && <p id={errorId} role="alert">{props.error}</p>}
      {props.items.map((item) => (
        <div key={item.id} id={item.titleId} data-fh-group-item>{item.children}</div>
      ))}
      {props.canAdd && (
        <button type="button" onClick={props.add} disabled={props.disabled} data-fh-group-add>
          {props.addLabel}
        </button>
      )}
    </div>
  );
}

<FormRenderer definition={definition} layout={{ group: Group }} onSubmit={send} />;
```

Keep the error and the Add button. With `address: []` in `initialValues` the group starts empty, Submit shows the group error and Add creates the item.

Use a one-item group only when the API expects `address` as an object. Map `address[0]` to it before sending.

## Related

- [Sections](/guide/sections): properties, rules and custom markup
- [Repeatable groups](/guide/groups): item count, conditions and error paths
- [Field types](/guide/fields#custom-field-types): custom types and `props`
- [Multi-step forms](/guide/steps): step conditions and navigation
