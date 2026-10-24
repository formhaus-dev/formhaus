<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import Message from 'primevue/message';

defineProps(controlShellProps);
</script>

<template>
  <div v-bind="rootProps" class="matrix__row">
    <div class="matrix__label">
      <span :id="`${f.id}-label`">{{ f.label }}</span>
      <Message v-if="f.helperText" :pt="{ root: { id: f.helperId, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">
        {{ f.helperText }}
      </Message>
    </div>
    <slot />
    <Message v-if="f.error" :pt="{ root: { id: f.errorId, class: 'matrix__error' } }" size="small" severity="error" variant="simple">{{ f.error }}</Message>
  </div>
</template>
