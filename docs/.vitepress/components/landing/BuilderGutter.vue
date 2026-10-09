<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import BuilderMenu from './BuilderMenu.vue';
import LucideIcon from './LucideIcon.vue';
import type { BuilderForm, MenuItem } from './builder-model';
import { canMove, canRemove, pageCount } from './builder-ops';

export type GutterAction = 'insert' | 'page' | 'up' | 'down' | 'remove' | 'required';

const props = defineProps<{ form: BuilderForm; index: number; guard: () => boolean }>();
const emit = defineEmits<{ action: [action: GutterAction]; grab: [event: PointerEvent] }>();

const id = useId();
const open = ref(false);
const anchor = ref<HTMLElement>();
const block = computed(() => props.form.blocks[props.index]);
const items = computed<MenuItem[]>(() => {
  const page = block.value.kind === 'page';
  const noun = page ? 'page' : 'question';
  const list: MenuItem[] = [{ id: 'insert', label: 'Add question below', icon: 'plus' }];
  if (block.value.kind === 'question') list.push({ id: 'required', label: 'Required', hint: 'Must be answered', icon: 'asterisk', checked: block.value.required });
  if (canMove(props.form, props.index, -1)) list.push({ id: 'up', label: `Move ${noun} up`, icon: 'arrow-up' });
  if (canMove(props.form, props.index, 1)) list.push({ id: 'down', label: `Move ${noun} down`, icon: 'arrow-down' });
  if (!page) list.push({ id: 'page', label: 'New page below', hint: 'Split the form here', icon: 'file' });
  if (canRemove(props.form, props.index)) list.push({ id: 'remove', label: page ? 'Delete page' : 'Delete', hint: page ? (pageCount(props.form) > 1 ? 'With its questions' : 'Questions stay as one page') : undefined, icon: 'trash', danger: true });
  return list;
});

function pick(action: string) {
  open.value = false;
  emit('action', action as GutterAction);
}
</script>

<template>
  <span class="nb-gutter">
    <span ref="anchor" class="nb-anchor">
      <button
        type="button"
        class="nb-tool nb-tool--grip"
        data-tip="Drag to move · Click for menu"
        aria-label="Block menu"
        :aria-expanded="open"
        @pointerdown="emit('grab', $event)"
        @click="props.guard() || (open = true)"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
      <BuilderMenu v-if="open" :id="`${id}-actions`" :items="items" :anchor="anchor" label="Block menu" @pick="pick" @close="open = false" />
    </span>
  </span>
</template>
