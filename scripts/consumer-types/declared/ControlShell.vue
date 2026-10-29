<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';

const props = defineProps(controlShellProps);
</script>

<template>
  <div v-bind="props.rootProps">
    <label :for="props.f.id">{{ props.f.label }}</label>
    <slot />
  </div>
</template>
