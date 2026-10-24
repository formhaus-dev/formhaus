<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';

defineProps(controlShellProps);
</script>

<template>
  <div v-bind="rootProps" class="matrix-row">
    <div class="matrix-row__label text-body-2">
      <span :id="`${f.id}-label`">{{ f.label }}</span>
      <div v-if="f.helperText" :id="f.helperId" class="text-caption text-medium-emphasis">{{ f.helperText }}</div>
      <div v-if="f.error" :id="f.errorId" class="text-caption text-error">{{ f.error }}</div>
    </div>
    <slot />
  </div>
</template>
