<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useFloating } from './builder-float';

const props = defineProps<{ root: HTMLElement | undefined }>();

const target = ref<HTMLElement | null>(null);
const text = ref('');
const el = ref<HTMLElement>();
const { position, update } = useFloating(() => target.value, el, () => ({ side: 'bottom', align: target.value?.closest('.nb-gutter, .nb-glyph') ? 'start' : 'center', gap: 6 }));
let timer: ReturnType<typeof setTimeout> | undefined;

function show(event: Event) {
  const next = (event.target as HTMLElement).closest<HTMLElement>('[data-tip]');
  if (!next || next === target.value) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    target.value = next;
    text.value = next.dataset.tip ?? '';
    update();
  }, event.type === 'focusin' ? 0 : 400);
}

function hide(event: Event) {
  const leaving = (event.target as HTMLElement).closest<HTMLElement>('[data-tip]');
  if (event.type === 'mouseout' && (event as MouseEvent).relatedTarget && leaving?.contains((event as MouseEvent).relatedTarget as Node)) return;
  clearTimeout(timer);
  target.value = null;
}

const events: [string, (event: Event) => void, boolean?][] = [
  ['mouseover', show], ['focusin', show], ['mouseout', hide], ['focusout', hide], ['mousedown', hide], ['keydown', hide], ['scroll', hide, true],
];

function bind(root: HTMLElement | undefined, on: boolean) {
  for (const [name, handler, capture] of events) root?.[on ? 'addEventListener' : 'removeEventListener'](name, handler, capture);
}

watch(() => props.root, (next, prev) => {
  bind(prev, false);
  bind(next, true);
}, { immediate: true });

onBeforeUnmount(() => {
  clearTimeout(timer);
  bind(props.root, false);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="target" ref="el" class="nb-tooltip" role="tooltip" :data-side="position.side" :style="{ left: `${position.x}px`, top: `${position.y}px` }">{{ text }}</div>
  </Teleport>
</template>
