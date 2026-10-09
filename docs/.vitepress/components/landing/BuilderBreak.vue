<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import AutoInput from './AutoInput.vue';
import BuilderMenu from './BuilderMenu.vue';
import LucideIcon from './LucideIcon.vue';
import type { BuilderPage, MenuItem } from './builder-model';

const props = defineProps<{ page: BuilderPage; position: number; pages: { uid: string; title: string }[] }>();
const emit = defineEmits<{ after: []; remove: []; edit: [] }>();

const root = ref<HTMLElement>();
const anchor = ref<HTMLElement>();
const open = ref(false);
const title = computed(() => props.pages.find((page) => page.uid === props.page.next)?.title);
const items = computed<MenuItem[]>(() => [
  { id: 'next', label: 'Next page', hint: 'Continue in order', icon: 'arrow-down' },
  ...props.pages.map((page) => ({ id: page.uid, label: page.title, hint: 'Skip ahead to this page', icon: 'file' as const })),
]);

async function focusText() {
  await nextTick();
  const input = root.value?.querySelector<HTMLInputElement>('.auto__input');
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
}

function pick(id: string) {
  open.value = false;
  delete props.page.routes;
  props.page.next = id === 'next' ? null : id;
  emit('edit');
  focusText();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('after');
  } else if (event.key === 'Backspace' && !props.page.title) {
    event.preventDefault();
    emit('remove');
  }
}
</script>

<template>
  <div ref="root" class="nb-block nb-page" :data-uid="page.uid">
    <div class="nb-line nb-page__line">
      <span class="nb-page__icon" aria-hidden="true"><LucideIcon name="file" /></span>
      <AutoInput v-model="page.title" placeholder="Page title" :label="`Page ${position + 1} title`" :select-on-focus="/^Page \d+$/.test(page.title)" @keydown="onKey" @input="emit('edit')" />
      <span v-if="pages.length" ref="anchor" class="nb-anchor">
        <button
          type="button"
          class="nb-tag"
          :class="page.next ? 'nb-tag--branch' : 'nb-tag--ghost'"
          :data-warn="!!page.next && !title"
          data-tip="Where this page continues after its questions"
          :aria-label="`After this page: ${page.next ? title ?? 'missing page' : 'next page'}`"
          @click="open = true"
        >
          then
          <LucideIcon name="arrow-right" />
          {{ page.next ? title ?? 'Missing page' : 'next' }}
          <LucideIcon name="chevron-down" class="nb-tag__chevron" />
        </button>
        <BuilderMenu v-if="open" :id="`${page.uid}-next`" :items="items" :current="page.next ?? 'next'" :anchor="anchor" label="Where this page continues" @pick="pick" @close="open = false; focusText()" />
      </span>
      <span class="nb-page__count">Page {{ position + 1 }}</span>
    </div>
  </div>
</template>
