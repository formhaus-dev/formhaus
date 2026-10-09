---
description: "Save account settings one field at a time with one FormRenderer per editable row, each with its own validation and submit handler."
---

# Inline edit and per-field save

Account settings often save one field at a time. Use one `FormRenderer` per editable row so each field has its own validation and submit handler.

## The pattern

Each editable row is its own form. One field, one validation cycle, one submit handler.

::: code-group
```tsx [React]
import { FormRenderer } from '@formhaus/react';

function DisplayNameRow({ user, onSave, onError }) {
  async function handleSubmit(values) {
    await onSave({ name: values.name });
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
      onSubmit={handleSubmit}
      onError={onError}
    />
  );
}
```

```vue [Vue]
<script setup>
import { FormRenderer } from '@formhaus/vue';

const props = defineProps(['user', 'onSave', 'onError']);

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
  await props.onSave({ name: values.name });
}
</script>

<template>
  <FormRenderer
    :definition="definition"
    :initial-values="{ name: user.name }"
    :submit-handler="handleSubmit"
    :on-error="props.onError"
  />
</template>
```
:::

Each row gets validation, error display and automatic busy state while React `onSubmit` or Vue `submitHandler` is pending. Rejections reach `onError`. Vue legacy `@submit` listeners cannot be awaited: if a listener performs the request, the parent must supply `loading` and its after-submit hook only observes event dispatch. Do not perform the same save in both `submitHandler` and `@submit`.

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

The renderer validates before calling the submit handler. The action component receives `loading` while navigation, submission or their hooks are pending, or when the parent supplies `loading`. The parent can use that prop to cover additional work.

## Why not one big form?

A single `FormRenderer` validates and submits all of its fields together. On a settings page, an invalid display name should not block an email update in another row.

## Tradeoffs

- Each row creates a `FormEngine`. Profile pages with 50 or more editable rows.
- Rows do not share state. Put cross-row state in the parent instead of relying on field conditions.
- Each row needs a submit handler. A small wrapper can hold shared save and error handling.

Use a single `FormRenderer` for forms that submit all fields together, such as checkout and multi-step onboarding.
