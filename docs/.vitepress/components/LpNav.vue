<script setup lang="ts">
import { computed, inject } from 'vue';
import { useData } from 'vitepress';
defineProps<{ mobile?: boolean }>();
const { page, frontmatter } = useData();
const closeScreen = inject<() => void>('close-screen');
const landing = computed(() => String(frontmatter.value.pageClass || '').split(/\s+/).includes('lp-page'));
const links = [
  { text: 'Templates', href: '/templates/', match: (path: string) => path.startsWith('templates/') },
  { text: 'Builder', href: '/build', match: (path: string) => path === 'build.md' },
  { text: 'Cloud', href: '/cloud', match: (path: string) => path === 'cloud.md' },
  { text: 'Pricing', href: '/pricing', match: (path: string) => path === 'pricing.md' },
  { text: 'Docs', href: '/guide/', match: () => false },
];
const items = computed(() => links.map((link) => ({ ...link, active: link.match(page.value.relativePath) })));
</script>

<template>
  <nav v-if="landing" class="lp-nav" :class="{ 'lp-nav--mobile': mobile }" aria-label="Main">
    <a
      v-for="link in items"
      :key="link.text"
      :href="link.href"
      :class="{ active: link.active }"
      :aria-current="link.active ? 'page' : undefined"
      @click="closeScreen?.()"
    >{{ link.text }}</a>
  </nav>
</template>

<style scoped>
.lp-nav { display: flex; margin-left: auto; font-size: 14px; font-weight: 500; }
a { display: flex; align-items: center; min-height: 44px; padding: 0 12px; line-height: var(--vp-nav-height); white-space: nowrap; color: var(--vp-c-text-1); cursor: pointer; transition: color 0.25s; }
a:hover, a.active { color: var(--vp-c-brand-1); }
a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.lp-nav--mobile { flex-direction: column; gap: 0; padding: 0; margin-left: 0; }
.lp-nav--mobile a { padding: 8px 0; line-height: 24px; border-bottom: 1px solid var(--vp-c-divider); }
@media (max-width: 959px) { .lp-nav:not(.lp-nav--mobile) { display: none; } }
</style>
