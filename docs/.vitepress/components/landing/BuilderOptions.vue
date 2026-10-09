<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import AutoInput from './AutoInput.vue';
import BuilderMenu from './BuilderMenu.vue';
import LucideIcon from './LucideIcon.vue';
import { canBranch, newOption, type BuilderOption, type BuilderQuestion, type MenuItem } from './builder-model';
import { BRANCH_ITEM, UNBRANCH_ITEM, branchShortcut, filterItems, slashQuery } from './builder-smart';
import { moveItem, usePointerDrag } from './builder-drag';

const props = defineProps<{ question: BuilderQuestion; pages: { uid: string; title: string }[] }>();
const emit = defineEmits<{ outdent: [position: number]; edit: []; branch: []; newPage: [option: BuilderOption] }>();

const root = ref<HTMLElement>();
const drag = usePointerDrag({
  root,
  rows: '.nb-option[data-position]',
  attr: 'position',
  scroller: () => root.value?.closest<HTMLElement>('.nb'),
  drop: (from, at) => { if (moveItem(props.question.options, from, at)) emit('edit'); },
});
const menu = ref<{ uid: string; kind: 'branch' | 'slash' } | null>(null);
const menuRef = ref<InstanceType<typeof BuilderMenu>[]>();
const branchable = computed(() => canBranch(props.question.type) && props.pages.length > 0);
const title = (uid: string) => props.pages.find((page) => page.uid === uid)?.title;

const branchItems = (option: BuilderOption): MenuItem[] => [
  ...(option.jump ? [UNBRANCH_ITEM] : []),
  { id: 'next', label: 'Next page', hint: 'Continue in order', icon: 'arrow-down' },
  ...props.pages.map((page) => ({ id: page.uid, label: page.title, hint: 'Jump here when picked', icon: 'file' as const })),
  { id: 'new', label: 'New page', hint: 'Create a page and jump to it', icon: 'plus' },
];

const slashItems = (option: BuilderOption) => filterItems(option.jump ? [UNBRANCH_ITEM, BRANCH_ITEM] : [BRANCH_ITEM], slashQuery(option.label) ?? '');

async function focusOption(uid: string | undefined) {
  await nextTick();
  const input = root.value?.querySelector<HTMLInputElement>(uid ? `[data-option="${uid}"] .auto__input` : '.nb-option .auto__input');
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
}

function close(uid: string) {
  menu.value = null;
  focusOption(uid);
}

function add(index = props.question.options.length) {
  const option = newOption();
  props.question.options.splice(index, 0, option);
  emit('edit');
  focusOption(option.uid);
}

function remove(index: number) {
  if (props.question.options.length <= 1) return;
  props.question.options.splice(index, 1);
  emit('edit');
  focusOption(props.question.options[Math.max(0, index - 1)]?.uid);
}

function onInput(option: BuilderOption) {
  emit('edit');
  const stripped = branchShortcut(option.label);
  if (stripped !== undefined && branchable.value) {
    option.label = stripped;
    menu.value = { uid: option.uid, kind: 'branch' };
    return;
  }
  const query = slashQuery(option.label);
  if (query !== null && branchable.value) menu.value = { uid: option.uid, kind: 'slash' };
  else if (menu.value?.kind === 'slash') menu.value = null;
}

function onKey(event: KeyboardEvent, index: number) {
  const options = props.question.options;
  const option = options[index];
  if (menu.value?.uid === option.uid && menu.value.kind === 'slash' && menuRef.value?.[0]?.onKey(event)) return;
  if (event.key === 'Enter' || (event.key === 'Tab' && event.shiftKey && !option.label)) {
    event.preventDefault();
    if (option.label) add(index + 1);
    else emit('outdent', index);
  } else if (event.key === 'Backspace' && !option.label) {
    event.preventDefault();
    remove(index);
  }
}

function pickBranch(option: BuilderOption, id: string) {
  menu.value = null;
  emit('branch');
  if (id === 'new') return emit('newPage', option);
  option.jump = id === 'next' || id === 'unbranch' ? null : id;
  emit('edit');
  focusOption(option.uid);
}

function onLeave(event: FocusEvent) {
  if (root.value?.contains(event.relatedTarget as Node)) return;
  const options = props.question.options;
  if (!options.some((option) => option.label)) return;
  while (options.length > 1 && !options[options.length - 1].label) options.pop();
}

function pickSlash(option: BuilderOption, id: string) {
  option.label = '';
  if (id === 'unbranch') {
    option.jump = null;
    emit('branch');
  }
  menu.value = id === 'branch' ? { uid: option.uid, kind: 'branch' } : null;
  emit('edit');
  if (!menu.value) focusOption(option.uid);
}
</script>

<template>
  <ul ref="root" class="nb-options" :aria-label="`Options for ${question.label || 'question'}`" @focusout="onLeave">
    <li
      v-for="(option, index) in question.options"
      :key="option.uid"
      class="nb-line nb-option"
      :data-option="option.uid"
      :data-position="index"
      :data-dragged="drag.from.value === index"
      :data-over="drag.over.value === index ? 'before' : drag.over.value === index + 1 && index === question.options.length - 1 ? 'after' : undefined"
    >
      <span class="nb-glyph nb-glyph--grip" :data-type="question.type" data-tip="Drag to reorder" aria-hidden="true" @pointerdown="drag.down($event, index)" />
      <span class="nb-anchor">
        <AutoInput
          v-model="option.label"
          :placeholder="`Option ${index + 1}`"
          :label="`Option ${index + 1}`"
          @keydown="onKey($event, index)"
          @input="onInput(option)"
        />
        <BuilderMenu
          v-if="menu?.uid === option.uid && menu.kind === 'slash'"
          :id="`${option.uid}-slash`"
          ref="menuRef"
          :anchor="() => root?.querySelector(`[data-option='${option.uid}'] .nb-anchor`)"
          :items="slashItems(option)"
          label="Option actions"
          passive
          @pick="pickSlash(option, $event)"
          @close="close(option.uid)"
        />
      </span>
      <span v-if="branchable" class="nb-anchor nb-branch">
        <button
          type="button"
          class="nb-tag"
          :class="option.jump ? 'nb-tag--branch' : 'nb-tag--ghost'"
          :data-warn="!!option.jump && !title(option.jump)"
          data-tip="Where this answer leads"
          :aria-label="`Where this answer leads: ${option.jump ? title(option.jump) ?? 'missing page' : 'next page'}`"
          @click="menu = { uid: option.uid, kind: 'branch' }"
        >
          <LucideIcon name="split" />
          {{ option.jump ? title(option.jump) ?? 'Missing page' : 'Branch' }}
          <LucideIcon name="chevron-down" class="nb-tag__chevron" />
        </button>
        <BuilderMenu
          v-if="menu?.uid === option.uid && menu.kind === 'branch'"
          :id="`${option.uid}-branch`"
          :items="branchItems(option)"
          :anchor="() => root?.querySelector(`[data-option='${option.uid}'] .nb-branch`)"
          :current="option.jump ?? 'next'"
          label="Where this answer leads"
          @pick="pickBranch(option, $event)"
          @close="close(option.uid)"
        />
      </span>
      <button
        v-if="question.options.length > 1"
        type="button"
        class="nb-tool nb-tool--ghost"
        data-tip="Remove option"
        :aria-label="`Remove option ${index + 1}`"
        @click="remove(index)"
      >
        <LucideIcon name="x" />
      </button>
    </li>
    <li class="nb-line nb-option nb-option--add">
      <button type="button" class="nb-ghost" @mousedown.prevent @click="add()">+ Add option</button>
    </li>
  </ul>
</template>
