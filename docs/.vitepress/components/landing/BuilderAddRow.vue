<script setup lang="ts">
import LucideIcon from './LucideIcon.vue';

defineProps<{ label: string }>();
const emit = defineEmits<{ add: [] }>();
</script>

<template>
  <button type="button" class="nb-add-row" @mousedown.prevent @click="emit('add')">
    <LucideIcon name="plus" class="nb-add-row__icon" />
    <span>{{ label }}</span>
  </button>
</template>
