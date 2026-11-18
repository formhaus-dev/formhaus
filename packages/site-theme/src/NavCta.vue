<script setup lang="ts">
import { inject } from 'vue';
import { cloudLogin } from './nav';
import { cloudPromotionEnabled } from './visibility';

const closeScreen = inject<() => void>('close-screen');
</script>

<template>
  <a v-if="cloudPromotionEnabled" class="fh-cloud" :href="cloudLogin" data-umami-event="signin-click" data-umami-event-location="nav" @click="closeScreen?.()">Open Cloud</a>
</template>
