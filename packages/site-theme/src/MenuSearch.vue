<script setup lang="ts">
import { inject } from 'vue';
import { searchRequests } from './search-state';

const closeScreen = inject<() => void>('close-screen');

function open() {
  closeScreen?.();
  searchRequests.value += 1;
}
</script>

<template>
  <button type="button" class="fh-menu-search" aria-haspopup="dialog" @click="open">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    Search docs
  </button>
</template>
