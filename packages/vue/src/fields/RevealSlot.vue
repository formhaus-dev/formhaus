<script setup lang="ts">
import { revealSlotProps } from '../innerProps';

defineProps(revealSlotProps);
</script>

<template>
  <div v-if="reveal" :id="reveal.id" class="fh-field__reveal" data-fh="reveal" :hidden="!reveal.open">
    <component :is="reveal.children" />
  </div>
</template>
