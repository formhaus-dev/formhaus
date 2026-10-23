<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import Message from 'primevue/message';
import type { PropType } from 'vue';
import { describedBy } from './field';

defineProps({
  id: { type: String, required: true },
  field: { type: Object as PropType<FormField>, required: true },
  error: String,
  kind: { type: String as PropType<'label' | 'inline' | 'fieldset'>, default: 'label' },
});
</script>

<template>
  <fieldset v-if="kind === 'fieldset'" class="field" data-fh="field" :aria-describedby="describedBy(id, field, error)">
    <legend class="field__label">{{ field.label }}</legend>
    <slot />
    <Message v-if="field.helperText" :pt="{ root: { id: `${id}-helper`, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">{{ field.helperText }}</Message>
    <Message v-if="error" :pt="{ root: { id: `${id}-error` } }" size="small" severity="error" variant="simple">{{ error }}</Message>
  </fieldset>
  <div v-else class="field" data-fh="field">
    <label v-if="kind === 'label'" :for="id" class="field__label">{{ field.label }}</label>
    <div v-else class="field__inline">
      <slot />
      <label :for="id">{{ field.label }}</label>
    </div>
    <slot v-if="kind === 'label'" />
    <Message v-if="field.helperText" :pt="{ root: { id: `${id}-helper`, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">{{ field.helperText }}</Message>
    <Message v-if="error" :pt="{ root: { id: `${id}-error` } }" size="small" severity="error" variant="simple">{{ error }}</Message>
  </div>
</template>
