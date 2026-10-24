<script setup lang="ts">
import type { RevealView } from '@formhaus/core';
import type { VNode } from 'vue';

defineProps<{ reveal?: RevealView<VNode> }>();
</script>

<template>
  <div v-if="reveal" :id="reveal.id" class="fh-field__reveal" data-fh="reveal" :hidden="!reveal.open">
    <component :is="reveal.children" />
  </div>
</template>
