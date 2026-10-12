<script setup lang="ts">
import { inject } from 'vue';
import { useData } from 'vitepress';
defineProps<{ mobile?: boolean }>();
const { page } = useData();
const closeScreen = inject<() => void>('close-screen');
const links = [
  { text: 'Templates', href: '/templates/' },
  { text: 'Builder', href: '/build' },
  { text: 'Pricing', href: '#pricing' },
  { text: 'Docs', href: '/cloud/overview' },
];
</script>

<template>
  <nav v-if="page.relativePath === 'cloud.md'" class="cloud-nav" :class="{ 'cloud-nav--mobile': mobile }" aria-label="Cloud navigation">
    <a v-for="link in links" :key="link.text" :href="link.href" @click="closeScreen?.()">{{ link.text }}</a>
  </nav>
</template>

<style scoped>
.cloud-nav { display: flex; margin-left: auto; font-size: 14px; font-weight: 500; }
a { display: flex; align-items: center; min-height: 44px; padding: 0 12px; line-height: var(--vp-nav-height); color: var(--vp-c-text-1); cursor: pointer; transition: color 0.25s; }
a:hover { color: var(--vp-c-brand-1); }
a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.cloud-nav--mobile { flex-direction: column; gap: 0; padding: 0; margin-left: 0; }
.cloud-nav--mobile a { padding: 8px 0; line-height: 24px; border-bottom: 1px solid var(--vp-c-divider); }
@media (max-width: 959px) { .cloud-nav:not(.cloud-nav--mobile) { display: none; } }
</style>
