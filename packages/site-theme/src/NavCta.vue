<script setup lang="ts">
import { inject } from 'vue';
import { cloudLogin } from './nav';

const closeScreen = inject<() => void>('close-screen');
</script>

<template>
  <a class="fh-cloud" :href="cloudLogin" data-umami-event="signin-click" data-umami-event-location="nav" @click="closeScreen?.()">Open Cloud</a>
</template>
