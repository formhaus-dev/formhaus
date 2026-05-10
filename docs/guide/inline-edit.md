# Inline Edit / Per-Field Save

Account settings pages save each field independently — change your display name, hit Save next to it, that single field updates. `FormRenderer` assumes one submit at the end, but it composes well into this pattern: **one `FormRenderer` per row**.

## The pattern

Each editable row is its own form. One field, one validation cycle, one submit handler.

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';

function DisplayNameRow({ user, onSave }) {
  return (
    <FormRenderer
      definition={{
        id: 'display-name',
        fields: [
          {
            key: 'name',
            type: 'text',
            label: 'Display name',
            validation: { required: true, minLength: 2 },
          },
        ],
        submit: { label: 'Save' },
      }}
      initialValues={{ name: user.name }}
      onSubmit={(values) => onSave({ name: values.name })}
    />
  );
}
```

```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';

const props = defineProps(['user']);
const emit = defineEmits(['save']);

const definition = {
  id: 'display-name',
  fields: [
    {
      key: 'name',
      type: 'text',
      label: 'Display name',
      validation: { required: true, minLength: 2 },
    },
  ],
  submit: { label: 'Save' },
};
</script>

<template>
  <FormRenderer
    :definition="definition"
    :initial-values="{ name: user.name }"
    @submit="(values) => emit('save', { name: values.name })"
  />
</template>
```
:::

You get validation, error display, async submit handling, and analytics events for free — same as a full multi-field form.

## Inline button layout

If the default actions footer is too heavy for a settings row, swap it via `ActionsComponent` (React) or `actionsComponent` (Vue):

::: code-group
```tsx [React]
import type { FormActionsProps } from '@formhaus/react';
import Button from '@mui/material/Button';

function InlineSaveActions({ onSubmit, loading }: FormActionsProps) {
  return (
    <Button onClick={onSubmit} loading={loading} size="small">
      Save
    </Button>
  );
}

<FormRenderer
  definition={definition}
  initialValues={{ name: user.name }}
  onSubmit={onSave}
  ActionsComponent={InlineSaveActions}
/>;
```
:::

The renderer wires the button to the engine: validation runs first, the button shows loading while `onSubmit` resolves, errors appear next to the field. You write the button. The engine handles the rest.

## Why not one big form?

A single `FormRenderer` with N fields validates and submits all-or-nothing. Settings pages need each field to save independently — display name failing shouldn't block the email change two rows down. One `FormRenderer` per row keeps the model simple: each row is a small autonomous form.

## Tradeoffs

- **N engine instances.** Each `FormRenderer` creates its own `FormEngine`. For 10 rows that's 10 instances, each with one field. Cheap, but not free. If you have 50+ rows in a single page, profile.
- **No cross-row state.** Each row is independent. If field B should clear when field A changes, you need a parent component holding shared state and passing it via `initialValues`.
- **Repeated submit boilerplate.** Each row writes its own `onSubmit`. A small wrapper component that takes `field`, `initialValue`, and an API call helps.

For account-settings-style pages this pattern is the right shape. For one-shot wizards or checkout, use a single `FormRenderer` with all fields.
