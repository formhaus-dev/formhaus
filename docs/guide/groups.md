---
title: "Repeatable groups"
description: "Let people add and remove items, such as participants or addresses. The value is an array of objects with per-item validation and conditions."
---

# Repeatable groups

A group repeats a set of fields, and people add or remove items. Requires `@formhaus/core` 0.14 and `"formatVersion": "1.1"`.

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

Each item holds the `defaultValue` of its fields, also an item from the initial values that leaves a field out. A hidden item field is left out of its item. Text values are trimmed per item, and unknown item keys are never submitted.

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
| `show`, `showAny` | condition[] | Group visibility. A hidden group is cleared. When it shows again, it gets its last items back, or else its initial items. |
| `validation` | object | `required`, `minLength`, `maxLength`, their messages and `validator`. |
| `fields` | field[] | Fields of one item. |

## Item count

- `required: true` means at least one item.
- `minLength` and `maxLength` count items. Their default messages are `At least {min} required` and `At most {max} allowed`.
- Renderers hide Add at `maxLength`, or at 100 items without it. A group never holds more than 1000 items, whatever `maxLength` says. They hide Remove at `minLength`, or at 1 item when `required`.
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
  "participants": "At most 5 allowed",
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

React and Vue render a group as a fieldset with one labelled card per item:

```html
<fieldset class="fh-group" id="…-participants">
  <legend class="fh-field__label">Participants</legend>
  <p class="fh-field__helper fh-group__helper">Up to 5 people per registration</p>
  <div class="fh-group__body">
    <div class="fh-group__item" role="group" aria-labelledby="…-participants--0">
      <div class="fh-group__header">
        <span class="fh-group__title" id="…-participants--0" tabindex="-1">Participant 1</span>
        <button class="fh-group__remove" aria-label="Remove Participant 1">Remove</button>
      </div>
      <div class="fh-group__fields"><!-- item fields --></div>
    </div>
    <button class="fh-group__add">Add participant</button>
  </div>
  <p class="fh-group__status" role="status">Participant 2 added</p>
</fieldset>
```

- Add focuses the first field of the new item.
- Remove on an item with answers opens a modal dialog first: `Remove Participant 2?`, a short warning, then Cancel and `Remove Participant 2`. Focus starts on Cancel. Escape, Cancel, the close button or a click on the backdrop closes it and returns focus to the item's Remove button. Empty items, or items that hold only their defaults, go at once. Turn it off with `confirmRemove={false}` (React) or `:confirm-remove="false"` (Vue).
- Remove focuses the heading of the next item, or Add when no item follows.
- A polite status region announces `{item} added` and `{item} removed`.
- Add and Remove call `onFieldChange` (React) or emit `fieldChange` (Vue) with the group key, the new items and all values.
- After a failed Submit, focus goes to the first invalid field. A count error focuses Add.
- Error summary links point at item fields and read `Email (Participant 2): Enter a valid email`.

The Add and Remove buttons reuse the action button classes, so theme tokens apply. Item cards use `.fh-group__item` and `--fh-card-padding`. The stylesheet is optional, see [Optional baseline styles](/guide/#optional-baseline-styles).

## Custom markup

Pass `group` and `groupItem` in [`layout`](/guide/custom-fields#layout-slots) to own the markup. Field components inside items still come from `components`.

```tsx
import type { GroupComponentProps } from '@formhaus/react';

function Participants({ id, label, items, canAdd, add }: GroupComponentProps) {
  return (
    <section id={id}>
      <h3>{label}</h3>
      {items.map((item) => (
        <article key={item.id} aria-labelledby={item.titleId} data-fh-group-item>
          <h4 id={item.titleId} tabIndex={-1}>{item.title}</h4>
          {item.children}
          {item.canRemove && <button type="button" onClick={item.remove}>{item.removeLabel}</button>}
        </article>
      ))}
      {canAdd && <button type="button" onClick={add} data-fh-group-add>Add</button>}
    </section>
  );
}

<FormRenderer definition={definition} layout={{ group: Participants }} onSubmit={send} />;
```

| Prop | Meaning |
|---|---|
| `id`, `group`, `label`, `helperText`, `error`, `describedBy` | Group texts and ids |
| `items` | `{ id, index, title, titleId, canRemove, remove, requestRemove, hasContent, removeLabel, removeName, disabled }` per item. React adds `children` with the item fields. Vue adds `fields`, a component that renders them |
| `canAdd`, `add`, `remove(id)`, `requestRemove(id)` | Item operations within `minLength` and `maxLength`. `requestRemove` asks first when the item has answers |
| `addLabel`, `removeLabel`, `status`, `disabled` | Button texts, the live announcement and the busy state |
| `itemComponent` | The resolved `groupItem` component |

Focus after Add and Remove finds its targets by these ids and attributes:

| Element | Mark it with |
|---|---|
| Group wrapper | the `id` prop |
| Item wrapper | `data-fh-group-item` |
| Item title | the `titleId` id and `tabindex="-1"` |
| Item Remove button | the id `${titleId}-remove` |
| Add button | `data-fh-group-add` |

Add focuses the first field inside the new item wrapper, or its title when the item has no field. Remove focuses the title of the next item, or the Add button. The `fh-group__item` and `fh-group__add` classes work in place of the attributes. `DefaultGroup` and `DefaultGroupItem` are exported for wrapping.

`layout.confirmDialog` replaces the remove dialog. It stays mounted and opens while a removal waits for an answer, see [Remove dialog](/guide/custom-fields#remove-dialog). `DefaultConfirmDialog` is a native `<dialog>` opened with `showModal()`.

In Vue, render the item fields with `<component :is="item.fields" />`, and declare props with `defineProps(groupComponentProps)` and `defineProps(groupItemComponentProps)`. See [Runtime props in Vue](/guide/custom-components#runtime-props-in-vue).

## Without a renderer

`FormEngine` alone is enough for Svelte, vanilla JS or any other UI:

```ts
import { FormEngine } from '@formhaus/core';

const engine = new FormEngine(definition);
engine.subscribe(render);

function render() {
  for (const [index, item] of engine.items('participants').entries()) {
    for (const field of item.fields) {
      const path = `participants.${index}.${field.key}`;
      draw(path, field, engine.errors[path]);
    }
  }
}

engine.addItem('participants');
engine.setValue('participants.0.email', 'ada@example.com');
engine.removeItem('participants', 0);
```

`items()` returns a stable `id` for keyed lists and the visible fields of each item. Errors use the same paths.

## Server validation

`validateSubmission()` checks groups too:

- The value must be an array of plain objects. More than `maxLength` items fails with the `maxItems` message. Without `maxLength`, more than 100 items fails with the `value` message.
- Unknown item keys are dropped.
- Every visible item field gets its type check and rules. Errors come back by path.

Upgrade the server before the clients. Core 0.13 and older treat a group as a custom field and pass its value through without checks.

## Translations

Group texts live at `fields.participants.label`, `itemLabel`, `addLabel`, `removeLabel` and `helperText`. Item fields live at `fields.participants.fields.email.label`. A translated `itemLabel` must keep `{index}`. The label catalog adds `addItem`, `removeItem`, `itemLabel`, `itemAdded`, `itemRemoved`, `removeItemNamed`, `removeItemPrompt`, `removeItemBody` and `cancel`. See [Translations](/guide/translations).
