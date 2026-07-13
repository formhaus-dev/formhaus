# Inline edit and per-field save

Account settings often save one field at a time. Use one `FormRenderer` per editable row so each field has its own validation and submit handler.

## The pattern

Each editable row is its own form. One field, one validation cycle, one submit handler.

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';
import { useState } from 'react';

function DisplayNameRow({ user, onSave, onError }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values) {
    setSaving(true);
    try {
      await onSave({ name: values.name });
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormRenderer
      definition={{
        id: 'display-name',
        title: 'Display name',
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
      loading={saving}
      onSubmit={handleSubmit}
    />
  );
}
```

```vue [Vue]
<script setup>
import { ref } from 'vue';
import { FormRenderer } from '@formhaus/vue';

const props = defineProps(['user', 'onSave', 'onError']);
const saving = ref(false);

const definition = {
  id: 'display-name',
  title: 'Display name',
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

async function handleSubmit(values) {
  saving.value = true;
  try {
    await props.onSave({ name: values.name });
  } catch (error) {
    props.onError(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :initial-values="{ name: user.name }"
    :loading="saving"
    @submit="handleSubmit"
  />
</template>
```
:::

Each row still gets normal validation and error display. The parent owns the async request state because `FormRenderer` does not wait for `onSubmit` before returning.

## Inline button layout

If the default actions footer is too heavy for a settings row, swap it via `ActionsComponent` (React) or `actionsComponent` (Vue):

::: code-group
```tsx [React]
import type { FormActionsProps } from '@formhaus/react';
import Button from '@mui/material/Button';

function InlineSaveActions({ onSubmit, loading }: FormActionsProps) {
  return (
    <Button type="button" onClick={onSubmit} loading={loading} size="small">
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

The renderer validates before calling `onSubmit`. The `loading` value comes from the `FormRenderer` prop, so the parent still decides when the button is busy.

## Why not one big form?

A single `FormRenderer` validates and submits all of its fields together. On a settings page, an invalid display name should not block an email update in another row.

## Tradeoffs

- Each row creates a `FormEngine`. Profile pages with 50 or more editable rows.
- Rows do not share state. Put cross-row state in the parent instead of relying on field conditions.
- Each row needs a submit handler. A small wrapper can hold the repeated request-state code.

Use a single `FormRenderer` for forms that submit all fields together, such as checkout and multi-step onboarding.
