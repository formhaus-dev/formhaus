---
title: "Testing forms"
description: "Add data-testid attributes to Formhaus forms with the testIds prop, read the default id scheme, name ids with a function and pass them to custom components."
---

# Testing

`testIds` adds `data-testid` attributes for Testing Library, Playwright and Cypress. It is off by default.

::: code-group
```tsx [React]
<FormRenderer definition={definition} testIds onSubmit={save} />
```

```vue [Vue]
<FormRenderer :definition="definition" test-ids @submit="save" />
```
:::

`HeadlessFormRenderer` takes the same prop.

## Default ids

With `testIds` set to `true`, each id starts with the definition `id`:

| Element | Test id | Example |
|---|---|---|
| The `form` element | `<id>.form` | `signup.form` |
| The control of a field: its `input`, `select` or `textarea` | `<id>.<key>` | `signup.email` |
| The `fieldset` of a `radio`, `multiselect`, `scale` or `rating` field | `<id>.<key>` | `signup.plan` |
| One option input of those fields | `<id>.<key>.<value>` | `signup.plan.pro`, `signup.nps.9` |
| A field in a group item | `<id>.<group>.<index>.<key>` | `signup.people.0.name` |
| The primary button on the last step, or of a single-step form | `<id>.submit` | `signup.submit` |
| The primary button on earlier steps | `<id>.next` | `signup.next` |
| The Back button | `<id>.back` | `signup.back` |
| The error summary | `<id>.summary` | `signup.summary` |

Default ids can collide. A field with the key `form`, `submit`, `next`, `back` or `summary` gets the same id as that element, and dots in keys or option values blur the parts: the option `a.b` of `plan` and the option `b` of a field `plan.a` both get `signup.plan.a.b`. For such forms, pass a function that builds unique ids, as below.

The options of a native `select` have no ids. Pick them by value, such as `selectOptions(screen.getByTestId('signup.country'), 'CA')`.

```ts
await user.type(screen.getByTestId('signup.email'), 'ada@example.com');
await user.click(screen.getByTestId('signup.plan.pro'));
await user.click(screen.getByTestId('signup.next'));
expect(screen.getByTestId('signup.summary')).toHaveTextContent('Email');
```

## Name ids yourself

Pass a function to choose the ids. It gets a `TestIdTarget` and returns the id, or `undefined` for none:

```ts
import type { TestIdTarget } from '@formhaus/core';

const testIds = (target: TestIdTarget) => {
  if (target.kind === 'field') return `field-${target.key}`;
  if (target.kind === 'option') return `field-${target.key}-${target.value}`;
  return `form-${target.kind}`;
};
```

```ts
type TestIdTarget =
  | { kind: 'form' | 'summary' | 'submit' | 'next' | 'back'; definitionId: string }
  | { kind: 'field'; definitionId: string; key: string }
  | { kind: 'option'; definitionId: string; key: string; value: string };
```

For a field in a group item, `key` is the item path, such as `people.0.name`.

## Custom components

A [custom field component](/guide/fields#override-default-components) gets the computed ids as props: `testId` for the field and `optionTestId(value)` for each option. Put them on the elements a test should find:

```tsx
export function ColorPicker({ field, value, onChange, testId, optionTestId }: FieldComponentProps) {
  return (
    <div role="radiogroup" data-testid={testId}>
      {field.options?.map((option) => (
        <button key={option.value} type="button" data-testid={optionTestId?.(option.value)} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

In Vue, declare both props, such as with `fieldComponentProps`. A component that does not declare them does not get them. A [custom actions component](/guide/custom-components) gets `testIds` with the `submit`, `next` and `back` ids.
