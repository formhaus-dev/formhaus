<script setup lang="ts">
import { computed, inject } from 'vue';
import { useData } from 'vitepress';
defineProps<{ mobile?: boolean }>();
const { frontmatter } = useData();
const landing = computed(() =>
  String(frontmatter.value.pageClass || '')
    .split(/\s+/)
    .includes('lp-page'),
);
const closeScreen = inject<() => void>('close-screen');
</script>

<template>
  <div v-if="landing" class="nav-cta" :class="{ 'nav-cta--mobile': mobile }">
    <a class="nav-signin" href="https://app.formhaus.dev/login" @click="closeScreen?.()">Sign in</a>
    <a class="nav-start" href="https://app.formhaus.dev/login" aria-label="Create a free form" data-umami-event="signup_cta_click" :data-umami-event-location="mobile ? 'nav_mobile' : 'nav'" @click="closeScreen?.()">
      <span class="nav-label-full">Create a free form</span>
      <span class="nav-label-short">Start free</span>
    </a>
  </div>
</template>

<style scoped>
.nav-cta { display: flex; align-items: center; gap: 16px; margin-left: 16px; flex-shrink: 0; white-space: nowrap; font-size: 14px; font-weight: 600; }
a { display: inline-flex; align-items: center; justify-content: center; position: relative; height: 32px; cursor: pointer; }
a::before { content: ""; position: absolute; inset: -6px 0; }
.nav-label-full { display: none; }
.nav-label-short { display: inline; }
@media (min-width: 1280px) {
  .nav-label-full { display: inline; }
  .nav-label-short { display: none; }
}
.nav-cta--mobile .nav-label-full { display: inline; }
.nav-cta--mobile .nav-label-short { display: none; }
.nav-start { padding: 0 14px; border-radius: 22px; color: var(--vp-button-brand-text); background: var(--vp-button-brand-bg); }
.nav-start:hover { background: var(--vp-button-brand-hover-bg); color: var(--vp-button-brand-hover-text); }
.nav-signin:hover { color: var(--vp-c-brand-1); }
a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.nav-cta--mobile { display: flex; flex-direction: column; align-items: stretch; gap: 8px; margin: 0 0 16px; }
.nav-cta--mobile a { height: 44px; }
.nav-cta--mobile a::before { inset: 0; }
.nav-cta--mobile .nav-start { order: -1; }
@media (max-width: 959px) { .nav-cta:not(.nav-cta--mobile) { display: none; } }
</style>
