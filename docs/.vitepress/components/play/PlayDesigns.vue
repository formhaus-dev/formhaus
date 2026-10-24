<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import { designGroups, designs } from './play-state';
import { roving } from './roving';

const { isDark } = useData();
const props = defineProps<{ designId: string }>();
const emit = defineEmits<{ choose: [id: string] }>();

const design = computed(() => designs.find((entry) => entry.id === props.designId) ?? designs[0]!);
const inlineDesigns = designs.filter((entry) => entry.inline);
const open = ref(false);
const root = ref<HTMLElement>();
const toggle = ref<HTMLButtonElement>();
const menu = ref<HTMLElement>();

const items = () => [...(menu.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];

async function show(focus: 'checked' | 'last' = 'checked') {
  open.value = true;
  await nextTick();
  const list = items();
  const checked = list.find((item) => item.getAttribute('aria-checked') === 'true') ?? list[0];
  (focus === 'last' ? list.at(-1) : checked)?.focus();
}

function hide(returnFocus = false) {
  if (!open.value) return;
  open.value = false;
  if (returnFocus) toggle.value?.focus();
}

function onPointer(event: Event) {
  if (!root.value?.contains(event.target as Node)) hide();
}

function onToggleKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  show(event.key === 'ArrowUp' ? 'last' : 'checked');
}

function onMenuKey(event: KeyboardEvent) {
  const list = items();
  const index = list.indexOf(document.activeElement as HTMLButtonElement);
  const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 };
  if (event.key in moves) {
    event.preventDefault();
    list[(moves[event.key]! + list.length) % list.length]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    hide(true);
  } else if (event.key === 'Tab') hide();
}

function pick(id: string) {
  hide(true);
  emit('choose', id);
}

onMounted(() => document.addEventListener('pointerdown', onPointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointer));
</script>

<template>
  <div class="play-seg play-seg--designs">
    <div class="play-seg__group" role="radiogroup" aria-label="Design system" @keydown="roving">
      <button
        v-for="(entry, index) in inlineDesigns"
        :key="entry.id"
        type="button"
        role="radio"
        :aria-checked="entry.id === designId"
        :tabindex="entry.id === designId || (!design.inline && index === 0) ? 0 : -1"
        @click="emit('choose', entry.id)"
      >
        {{ entry.label }}<span class="play-seg__tag">{{ entry.framework }}</span>
      </button>
    </div>
    <div ref="root" class="play-more">
      <button
        ref="toggle"
        type="button"
        class="play-more__toggle"
        aria-haspopup="menu"
        :aria-expanded="open"
        :data-active="!design.inline || undefined"
        @click="open ? hide() : show()"
        @keydown="onToggleKey"
      >
        <template v-if="design.inline">More</template>
        <template v-else>{{ design.label }}<span class="play-seg__tag">{{ design.framework }}</span></template>
        <LucideIcon name="chevron-down" />
      </button>
      <div v-if="open" ref="menu" class="play-menu" role="menu" aria-label="More design systems" @keydown="onMenuKey">
        <div
          v-for="section in designGroups"
          :key="section.group"
          class="play-menu__section"
          role="group"
          :aria-labelledby="`play-menu-${section.group}`"
        >
          <p :id="`play-menu-${section.group}`" class="play-menu__group">{{ section.group }}</p>
          <button
            v-for="entry in section.entries"
            :key="entry.id"
            type="button"
            role="menuitemradio"
            :aria-checked="entry.id === designId"
            class="play-menu__item"
            tabindex="-1"
            @click="pick(entry.id)"
          >
            <span>{{ entry.label }}<span class="play-seg__tag">{{ entry.framework }}</span><span v-if="entry.lightOnly && isDark" class="play-note">Light only</span></span>
            <LucideIcon v-if="entry.id === designId" name="check" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
