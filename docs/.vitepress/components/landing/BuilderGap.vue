<script setup lang="ts">
import LucideIcon from './LucideIcon.vue';

defineProps<{ active?: boolean }>();
const emit = defineEmits<{ insert: [] }>();
</script>

<template>
  <div class="nb-gap" :data-active="active" data-tip="Insert a question here" aria-hidden="true" @mousedown.prevent @click="emit('insert')">
    <span class="nb-gap__plus"><LucideIcon name="plus" /></span>
    <span class="nb-gap__line" />
  </div>
</template>
