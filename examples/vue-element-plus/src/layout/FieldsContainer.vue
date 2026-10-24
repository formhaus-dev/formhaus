<script setup lang="ts">
import { fieldsContainerProps } from '@formhaus/vue';

defineProps(fieldsContainerProps);
</script>

<template>
  <div v-bind="rootProps" class="fields">
    <slot />
  </div>
</template>
