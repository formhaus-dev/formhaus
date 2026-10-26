<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { useRoute } from 'vitepress';
import { navGroups, navLinks } from './nav';
import './site-nav.css';

const props = defineProps<{ mobile?: boolean }>();
const uid = useId();
const route = useRoute();
const root = ref<HTMLElement>();
const open = ref<string | null>(null);
const closeScreen = inject<() => void>('close-screen');
const path = computed(() => route.path.replace(/\.html$/, '').replace(/\/index$/, '/'));
const links = computed(() => navLinks.map((link) => ({ ...link, active: link.match.test(path.value) })));
const topActive = computed(() => links.value.some((link) => link.active));
const current = (href: string) => href === path.value;
const groupActive = (id: string) =>
  !topActive.value && navGroups.find((group) => group.id === id)!.links.some((link) => current(link.href));

function leave(event: FocusEvent) {
  if (!props.mobile && !root.value?.contains(event.relatedTarget as Node | null)) open.value = null;
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = null;
}
function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return;
  event.preventDefault();
  document.getElementById(`${uid}-${open.value}`)?.focus();
  open.value = null;
}
function follow() {
  if (!props.mobile) open.value = null;
  closeScreen?.();
}
onMounted(() => {
  if (props.mobile) return;
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', closeOnEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  document.removeEventListener('keydown', closeOnEscape);
});
</script>

<template>
  <nav ref="root" class="fh-nav" :class="{ 'fh-nav--mobile': mobile }" aria-label="Main" @focusout="leave">
    <div v-for="group in navGroups" :key="group.id" class="fh-nav__group">
      <button
        :id="`${uid}-${group.id}`"
        type="button"
        :aria-expanded="open === group.id"
        :class="{ active: groupActive(group.id) }"
        :aria-controls="`${uid}-${group.id}-panel`"
        @click="open = open === group.id ? null : group.id"
      >
        {{ group.label }}
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div v-if="open === group.id" :id="`${uid}-${group.id}-panel`" class="fh-nav__panel">
        <a v-for="link in group.links" :key="link.href" :href="link.href" :class="{ active: current(link.href) }" :aria-current="current(link.href) ? 'page' : undefined" @click="follow">
          <span>{{ link.label }}</span>
          <small>{{ link.description }}</small>
        </a>
      </div>
    </div>
    <a v-for="link in links" :key="link.href" class="fh-nav__link" :class="{ active: link.active }" :href="link.href" :aria-current="link.active ? 'page' : undefined" @click="follow">{{ link.label }}</a>
  </nav>
</template>
