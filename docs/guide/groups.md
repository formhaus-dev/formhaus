---
title: "Repeatable groups"
description: "Let people add and remove items, such as participants or addresses. The value is an array of objects with per-item validation and conditions."
---

# Repeatable groups

A group repeats a set of fields, and people add or remove items. Requires `@formhaus/core` 0.15 and `"formatVersion": "1.1"`.

```json
{
  "formatVersion": "1.1",
  "id": "registration",
  "title": "Registration",
  "submit": { "label": "Register" },
  "fields": [
    {
      "key": "participants",
      "type": "group",
      "label": "Participants",
      "itemLabel": "Participant {index}",
      "addLabel": "Add participant",
      "removeLabel": "Remove",
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

The submitted value is an array of objects:

```json
{ "participants": [{ "name": "Ada", "email": "ada@example.com", "diet": "none" }] }
```

A hidden item field is left out of its item. Text values are trimmed per item, and unknown item keys are never submitted.

## Properties

| Property | Type | Description |
|---|---|---|
| `key` | string | Key of the item array. |
| `type` | `"group"` | |
| `label` | string | Group heading. |
| `helperText` | string | Text under the heading. |
| `itemLabel` | string | Item heading. `{index}` is the item number from 1, `{label}` the group label. Default `{label} {index}`. |
| `addLabel`, `removeLabel` | string | Button texts. Default `Add` and `Remove`. |
| `defaultItems` | integer | Number of items the group starts with. |
| `show`, `showAny` | condition[] | Group visibility. A hidden group is cleared. |
| `validation` | object | `required`, `minLength`, `maxLength`, their messages and `validator`. |
| `fields` | field[] | Fields of one item. |

## Item count

- `required: true` means at least one item.
- `minLength` and `maxLength` count items. Their default messages are `Must be at least {min} items` and `Must be at most {max} items`.
- Renderers hide Add at `maxLength`, or at 100 items without it. They hide Remove at `minLength`, or at 1 item when `required`.
- `validator` receives the whole array, so it can check rules across items.

## Conditions inside items

- An item field condition can test the other fields of the same item. It runs per item.
- It can also test fields outside the group, under the usual [step rules](/guide/conditions).
- A field outside the group cannot test an item field. That is a `group-scope` error. Test the group itself instead, such as `{ "field": "participants", "notEmpty": true }`.
- `matchField` follows the same scope, so `"matchField": "email"` inside an item compares with the email of that item.

Item keys must be unique in the group and must not repeat a key outside it. No other key may start with `participants.`. Groups do not nest, and `file` and `hidden` fields are not allowed in a group.

## Error paths

Item errors use `<group>.<index>.<field>` with a 0-based index. Count errors use the group key.

```json
{
  "participants": "Must be at most 5 items",
  "participants.1.email": "Enter a valid email"
}
```

`engine.errors`, `stepErrors`, `setErrors()`, the `errors` prop and [submit results](/spec#server-errors) all use these paths. When an item is removed, the errors of later items move with them.

## Engine API

```ts
engine.addItem('participants');
engine.setItemValue('participants', 0, 'email', 'ada@example.com');
engine.setValue('participants.0.email', 'ada@example.com');
engine.removeItem('participants', 1);
engine.items('participants');
```

`items(key)` returns `{ id, fields }` for each item: a stable id for list keys and the visible fields of that item. See the [FormEngine reference](/api/form-engine#groups).

## Rendering and focus

React and Vue render a group as a fieldset with one fieldset per item:

```html
<fieldset class="fh-group" id="…-participants">
  <legend class="fh-field__label">Participants</legend>
  <fieldset class="fh-group__item">
    <legend class="fh-group__title" tabindex="-1">Participant 1</legend>
    <!-- item fields -->
    <button class="fh-group__remove" aria-label="Remove Participant 1">Remove</button>
  </fieldset>
  <button class="fh-group__add">Add participant</button>
  <p class="fh-group__status" role="status">Participant 2 added</p>
</fieldset>
```

- Add focuses the first field of the new item.
- Remove focuses the heading of the next item, or Add when no item follows.
- A polite status region announces `{item} added` and `{item} removed`.
- After a failed Submit, focus goes to the first invalid field. A count error focuses Add.
- Error summary links point at item fields and read `Email (Participant 2): Enter a valid email`.

The Add and Remove buttons reuse the action button classes, so theme tokens apply. Item cards use `.fh-group__item`.

## Server validation

`validateSubmission()` checks groups too:

- The value must be an array of plain objects. More than `maxLength` items, and more than 100, fails with the `value` message.
- Unknown item keys are dropped.
- Every visible item field gets its type check and rules. Errors come back by path.

Upgrade the server before the clients. Core 0.14 and older treat a group as a custom field and pass its value through without checks.

## Translations

Group texts live at `fields.participants.label`, `itemLabel`, `addLabel`, `removeLabel` and `helperText`. Item fields live at `fields.participants.fields.email.label`. A translated `itemLabel` must keep `{index}`. The label catalog adds `addItem`, `removeItem`, `itemLabel`, `itemAdded` and `itemRemoved`. See [Translations](/guide/translations).
