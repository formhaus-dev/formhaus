<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import { type PlayForm, playForms, playGroups, templateCount } from './play-catalog';

const props = defineProps<{ modelValue: string; inline?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [key: string] }>();
const uid = useId();
const query = ref('');
const active = ref(-1);
const open = ref(false);
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const input = ref<HTMLInputElement>();
const list = ref<HTMLElement>();

const current = computed(() => playForms.find((form) => form.key === props.modelValue) ?? playForms[0]!);
const needle = computed(() => query.value.trim().toLowerCase());
const matches = (form: PlayForm, label: string) =>
  !needle.value ||
  form.title.toLowerCase().includes(needle.value) ||
  (needle.value.length >= 3 && form.group !== 'start' && label.toLowerCase().startsWith(needle.value));
const sections = computed(() => {
  let index = 0;
  return playGroups
    .map((group) => ({
      ...group,
      items: playForms
        .filter((form) => form.group === group.id && matches(form, group.label))
        .map((form) => ({ ...form, index: index++, id: `${uid}-o${index}` })),
    }))
    .filter((group) => group.items.length);
});
const options = computed(() => sections.value.flatMap((section) => section.items));
const activeId = computed(() => options.value[active.value]?.id);

function parts(title: string) {
  const at = needle.value ? title.toLowerCase().indexOf(needle.value) : -1;
  if (at < 0) return [title, '', ''];
  return [title.slice(0, at), title.slice(at, at + needle.value.length), title.slice(at + needle.value.length)];
}

async function setActive(index: number, center = false) {
  active.value = index;
  await nextTick();
  const element = list.value?.querySelector<HTMLElement>('[data-active]');
  if (!element || !list.value) return;
  const box = list.value;
  if (center) box.scrollTop = element.offsetTop - box.clientHeight / 2 + element.offsetHeight / 2;
  else if (element.offsetTop - 34 < box.scrollTop) box.scrollTop = element.offsetTop - 34;
  else if (element.offsetTop + element.offsetHeight > box.scrollTop + box.clientHeight)
    box.scrollTop = element.offsetTop + element.offsetHeight - box.clientHeight + 8;
}

function reset() {
  const selected = options.value.findIndex((option) => option.key === props.modelValue);
  setActive(needle.value ? (options.value.length ? 0 : -1) : selected, !needle.value);
}

function choose(key: string) {
  emit('update:modelValue', key);
  if (!props.inline) hide(true);
}

async function show() {
  open.value = true;
  query.value = '';
  if (matchMedia('(max-width: 959px)').matches) root.value?.scrollIntoView({ block: 'start' });
  await nextTick();
  reset();
  input.value?.focus({ preventScroll: true });
}

function hide(focus: boolean) {
  if (props.inline || !open.value) return;
  open.value = false;
  if (focus) trigger.value?.focus({ preventScroll: true });
}

function onTriggerKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  show();
}

function move(index: number) {
  setActive(index);
  if (props.inline) choose(options.value[index]!.key);
}

function onKey(event: KeyboardEvent) {
  const count = options.value.length;
  const step = ({ ArrowDown: 1, ArrowUp: -1, PageDown: 6, PageUp: -6 } as Record<string, number>)[event.key];
  if (step) {
    event.preventDefault();
    const from = active.value < 0 ? (step > 0 ? -1 : count) : active.value;
    if (count) move(Math.max(0, Math.min(count - 1, from + step)));
  } else if ((event.key === 'Home' || event.key === 'End') && !query.value && count) {
    event.preventDefault();
    move(event.key === 'Home' ? 0 : count - 1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (active.value >= 0) choose(options.value[active.value]!.key);
  } else if (event.key === 'Escape') {
    if (props.inline) query.value = '';
    else {
      event.preventDefault();
      hide(true);
    }
  }
}

function pick(option: PlayForm & { index: number }) {
  choose(option.key);
  if (!props.inline) return;
  setActive(option.index);
  input.value?.focus({ preventScroll: true });
}

function onPointer(event: Event) {
  if (open.value && !root.value?.contains(event.target as Node)) hide(false);
}

watch(needle, reset);
watch(
  () => props.modelValue,
  (key) => !needle.value && options.value[active.value]?.key !== key && reset(),
);
onMounted(() => {
  reset();
  if (!props.inline) document.addEventListener('pointerdown', onPointer);
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointer));
</script>

<template>
  <div ref="root" class="cb" :class="{ 'cb--inline': inline }" :data-open="open || undefined">
    <button
      v-if="!inline"
      ref="trigger"
      type="button"
      class="cb-trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${uid}-pop`"
      @click="open ? hide(false) : show()"
      @keydown="onTriggerKey"
    >
      <span class="cb-trigger__text">
        <span class="cb-trigger__eyebrow">Form</span>
        <span class="cb-trigger__title">{{ current.title }}</span>
      </span>
      <span class="cb-trigger__meta">{{ current.meta }}</span>
      <LucideIcon name="chevron-down" />
    </button>
    <div v-show="inline || open" :id="`${uid}-pop`" class="cb-pop">
      <div class="cb-search">
        <LucideIcon name="search" />
        <input
          ref="input"
          v-model="query"
          class="cb-input"
          type="search"
          role="combobox"
          :aria-expanded="inline || open"
          :aria-controls="`${uid}-list`"
          aria-autocomplete="list"
          aria-label="Search forms and templates"
          :aria-activedescendant="activeId"
          :placeholder="`Search ${templateCount} templates`"
          autocomplete="off"
          spellcheck="false"
          @keydown="onKey"
        />
      </div>
      <ul :id="`${uid}-list`" ref="list" class="cb-list" role="listbox" aria-label="Forms" @mousedown="!inline && $event.preventDefault()">
        <template v-for="section in sections" :key="section.id">
          <li class="cb-group" role="presentation">
            <span>{{ section.label }}</span><span class="cb-group__count">{{ section.items.length }}</span>
          </li>
          <li
            v-for="option in section.items"
            :id="option.id"
            :key="option.key"
            class="cb-option"
            role="option"
            :aria-selected="option.key === modelValue"
            :data-active="option.index === active || undefined"
            @click="pick(option)"
          >
            <span class="cb-option__title">{{ parts(option.title)[0] }}<mark v-if="parts(option.title)[1]">{{ parts(option.title)[1] }}</mark>{{ parts(option.title)[2] }}</span>
            <span class="cb-option__meta">{{ option.meta }}</span>
          </li>
        </template>
        <li v-if="!options.length" class="cb-empty" role="presentation">No forms match “{{ query }}”</li>
      </ul>
    </div>
  </div>
</template>
