<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import LucideIcon from './LucideIcon.vue';
import type { MenuItem } from './builder-model';
import { useFloating, type Anchor } from './builder-float';

const props = defineProps<{ id: string; items: MenuItem[]; current?: string; label: string; anchor: Anchor; passive?: boolean; align?: 'start' | 'end' }>();
const emit = defineEmits<{ pick: [id: string]; close: [] }>();

const list = ref<HTMLElement>();
const active = ref(Math.max(0, props.items.findIndex((item) => item.id === props.current)));
const { position, update } = useFloating(() => props.anchor, list, { side: 'bottom', align: props.align ?? 'start', gap: 4 });

onMounted(() => {
  if (!props.passive) list.value?.focus();
});

watch(() => props.items, (items) => {
  if (active.value >= items.length) active.value = 0;
  update();
});

function onKey(event: KeyboardEvent): boolean {
  const last = props.items.length - 1;
  if (event.key === 'ArrowDown') active.value = active.value >= last ? 0 : active.value + 1;
  else if (event.key === 'ArrowUp') active.value = active.value <= 0 ? last : active.value - 1;
  else if (event.key === 'Home') active.value = 0;
  else if (event.key === 'End') active.value = last;
  else if (event.key === 'Enter' || (event.key === ' ' && !props.passive)) {
    if (props.items[active.value]) emit('pick', props.items[active.value].id);
    else emit('close');
  } else if (event.key === 'Escape' || event.key === 'Tab') emit('close');
  else return false;
  if (event.key !== 'Tab') event.preventDefault();
  return true;
}

function onBlur() {
  if (props.passive) return;
  setTimeout(() => { if (document.activeElement !== list.value) emit('close'); }, 0);
}

defineExpose({ onKey });
</script>

<template>
  <Teleport to="body">
    <ul
      :id="`${props.id}-menu`"
      ref="list"
      class="nb-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      role="listbox"
      :tabindex="passive ? undefined : -1"
      :aria-label="props.label"
      :aria-activedescendant="`${props.id}-menu-${active}`"
      @keydown="onKey"
      @blur="onBlur"
    >
      <li v-if="!props.items.length" class="nb-menu__empty">No matches</li>
      <li
        v-for="(item, index) in props.items"
        :id="`${props.id}-menu-${index}`"
        :key="item.id"
        role="option"
        class="nb-menu__item"
        :data-danger="item.danger"
        :aria-selected="item.id === props.current"
        :data-active="index === active"
        @mousedown.prevent
        @mouseenter="active = index"
        @click="emit('pick', item.id)"
      >
        <span class="nb-menu__icon" aria-hidden="true"><LucideIcon v-if="item.icon" :name="item.icon" /></span>
        <span class="nb-menu__text">
          <span class="nb-menu__label">{{ item.label }}</span>
          <span v-if="item.hint" class="nb-menu__hint">{{ item.hint }}</span>
        </span>
        <LucideIcon v-if="item.checked || item.id === props.current" name="check" class="nb-menu__check" />
      </li>
    </ul>
  </Teleport>
</template>
