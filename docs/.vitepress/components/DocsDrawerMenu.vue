<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSidebar } from 'vitepress/theme';
import VPSidebarGroup from 'vitepress/dist/client/theme-default/components/VPSidebarGroup.vue';
import GithubStar from './GithubStar.vue';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const { hasSidebar, sidebarGroups } = useSidebar();
const closeScreen = inject<() => void>('close-screen');
const root = ref<HTMLElement>();
let hamburger: HTMLElement | null = null;

function screenOf(): HTMLElement | null {
  return root.value?.closest<HTMLElement>('.VPNavScreen') ?? null;
}

function focusables(): HTMLElement[] {
  const inside = Array.from(screenOf()?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
  return hamburger ? [hamburger, ...inside] : inside;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeScreen?.();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !items.includes(active as HTMLElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !items.includes(active as HTMLElement))) {
    event.preventDefault();
    first.focus();
  }
}

function revealCurrent() {
  const screen = screenOf();
  const current = root.value?.querySelector<HTMLElement>('.is-active > .item a');
  if (!screen || !current) return;
  const offset = current.getBoundingClientRect().top - screen.getBoundingClientRect().top;
  screen.scrollTop += offset - screen.clientHeight / 2;
  current.focus({ preventScroll: true });
}

function onClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('a')) closeScreen?.();
}

onMounted(() => {
  hamburger = document.querySelector<HTMLElement>('.VPNavBarHamburger');
  document.addEventListener('keydown', onKeydown);
  nextTick(revealCurrent);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  hamburger?.focus();
});
</script>

<template>
  <div v-if="hasSidebar" ref="root" class="drawer-menu" @click="onClick">
    <GithubStar class="drawer-star" />
    <nav class="drawer-sidebar" aria-label="Sidebar Navigation">
      <VPSidebarGroup :items="sidebarGroups" />
    </nav>
  </div>
</template>

<style scoped>
.drawer-menu {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.drawer-star {
  margin-left: 0;
}

.drawer-sidebar {
  margin-top: 16px;
}

.drawer-sidebar :deep(.group) {
  width: auto;
}

.drawer-sidebar :deep(.link) {
  min-height: 40px;
  align-items: center;
}
</style>
