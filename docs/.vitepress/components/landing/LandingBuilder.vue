<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import AutoInput from './AutoInput.vue';
import BuilderActions from './BuilderActions.vue';
import BuilderBreak from './BuilderBreak.vue';
import BuilderGap from './BuilderGap.vue';
import BuilderGutter, { type GutterAction } from './BuilderGutter.vue';
import BuilderQuestion from './BuilderQuestion.vue';
import BuilderTooltip from './BuilderTooltip.vue';
import { moveTo, usePointerDrag } from './builder-drag';
import { newPage, pagesAfter, type BuilderForm, type BuilderOption, type BuilderPage } from './builder-model';
import { convertToPage, insertPage, insertQuestion, moveBlock, outdent, pageSpan, removeBlock, startOptions } from './builder-ops';
import type { Shortcut } from './builder-smart';
import './builder.css';
import './builder-tools.css';
import './builder-menu.css';

const props = defineProps<{ form: BuilderForm; edited: boolean }>();
const emit = defineEmits<{ edit: [] }>();

const root = ref<HTMLElement>();
const pending = ref<string | null>(null);
const drag = usePointerDrag({
  root,
  rows: '.nb-doc > .nb-row',
  scroller: () => root.value,
  drop: (from, at) => { if (moveTo(props.form, from, at)) touch(); },
});
const blocks = () => props.form.blocks;
const later = computed(() => pagesAfter(props.form));
const inputs = () => [...(root.value?.querySelectorAll<HTMLInputElement>('.nb-doc .auto__input') ?? [])];
const pageNumber = (index: number) => blocks().slice(0, index + 1).filter((block) => block.kind === 'page').length - 1;
const lastOfPage = (index: number) => blocks()[index + 1]?.kind !== 'question' && (blocks()[index].kind === 'question' || blocks()[index].kind === 'page');
const pageAt = (index: number) => blocks().slice(0, index + 1).reverse().find((block) => block.kind === 'page') as BuilderPage | undefined;

function caretEnd(input: HTMLInputElement | null | undefined) {
  if (!input) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

async function focusUid(uid: string, last = false) {
  await nextTick();
  const list = root.value?.querySelectorAll<HTMLInputElement>(`[data-uid="${uid}"] .auto__input`);
  caretEnd(last ? list?.[list.length - 1] : list?.[0]);
}

async function focusBefore(index: number) {
  await nextTick();
  const prev = blocks()[index - 1];
  if (prev) return focusUid(prev.uid, true);
  caretEnd(root.value?.querySelector<HTMLInputElement>('.nb-title .auto__input'));
}

const touch = () => emit('edit');

function addQuestion(at: number) {
  const question = insertQuestion(props.form, at);
  touch();
  pending.value = question.uid;
}

function addPage(at: number) {
  const page = insertPage(props.form, at);
  touch();
  focusUid(page.uid);
}

function toPage(index: number) {
  const page = convertToPage(props.form, index);
  touch();
  focusUid(page.uid);
}

function remove(index: number) {
  if (!removeBlock(props.form, index)) return focusBefore(index);
  touch();
  focusBefore(index);
}

function cancel(index: number) {
  if (removeBlock(props.form, index)) touch();
}

function removeEmpty(index: number) {
  const block = blocks()[index];
  if (block.kind === 'page' && pageSpan(props.form, index) > 1) return focusBefore(index);
  remove(index);
}

function onAction(index: number, action: GutterAction) {
  const block = blocks()[index];
  if (action === 'insert') addQuestion(index + 1);
  else if (action === 'page') addPage(index + 1);
  else if (action === 'remove') remove(index);
  else if (action === 'required' && block.kind === 'question') {
    block.required = !block.required;
    touch();
  } else if (action === 'up' || action === 'down') {
    if (moveBlock(props.form, index, action === 'up' ? -1 : 1)) touch();
    focusUid(block.uid);
  }
}

function onOutdent(index: number, position: number) {
  const question = outdent(props.form, index, position);
  if (!question) return;
  touch();
  if (question.label) focusUid(question.uid);
  else pending.value = question.uid;
}

function onShortcut(index: number, found: Shortcut) {
  if (found.kind === 'page') return toPage(index);
  const target = startOptions(props.form, index, found.type);
  if (!target) return;
  touch();
  focusUid(target.uid, true);
}

function onBranch(index: number) {
  const page = pageAt(index);
  if (page) delete page.routes;
}

function onNewPage(option: BuilderOption) {
  const page = newPage();
  blocks().push(page);
  option.jump = page.uid;
  touch();
  focusUid(page.uid);
}

function onMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('button, input, textarea, a, .nb-gap')) return;
  const line = target.closest<HTMLElement>('.nb-line') ?? target.closest<HTMLElement>('.nb-row');
  const input = line?.querySelector<HTMLInputElement>('.auto__input');
  if (!input) return;
  event.preventDefault();
  caretEnd(input);
}

function onTail() {
  const last = blocks()[blocks().length - 1];
  if (last?.kind === 'question' && !last.label) return focusUid(last.uid);
  addQuestion(blocks().length);
}

function onKey(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement;
  if (!target.classList.contains('auto__input')) return;
  if (event.key === 'Escape' && !event.defaultPrevented) return target.blur();
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  const delta = event.key === 'ArrowUp' ? -1 : 1;
  const row = target.closest<HTMLElement>('[data-index]');
  if (event.altKey && row) {
    event.preventDefault();
    if (moveBlock(props.form, Number(row.dataset.index), delta)) touch();
    return focusUid(row.dataset.uid!);
  }
  const list = inputs();
  const next = list[list.indexOf(target) + delta];
  if (!next) return;
  event.preventDefault();
  caretEnd(next);
}
</script>

<template>
  <div ref="root" class="nb" :data-dragging="drag.from.value !== null" @mousedown="onMouseDown">
    <div class="nb-doc" @keydown="onKey">
      <p v-if="!edited" class="nb-hint">Click any line to edit · <kbd>Enter</kbd> adds a question · <kbd>⇧Tab</kbd> turns an answer into a question · hover an answer to branch</p>
      <div class="nb-line nb-title">
        <AutoInput v-model="form.title" placeholder="Untitled form" label="Form title" @input="touch" />
      </div>
      <template v-for="(block, index) in form.blocks" :key="block.uid">
        <BuilderGap v-if="index > 0 || block.kind !== 'page' || drag.from.value !== null" :active="drag.over.value === index" @insert="addQuestion(index)" />
        <div class="nb-row" :data-index="index" :data-uid="block.uid" :data-kind="block.kind" :data-dragged="drag.from.value === index">
          <BuilderGutter :form="form" :index="index" :guard="drag.wasDrag" @action="onAction(index, $event)" @grab="drag.down($event, index)" />
          <BuilderBreak v-if="block.kind === 'page'" :page="block" :position="pageNumber(index)" :pages="later[index]" @after="addQuestion(index + 1)" @remove="removeEmpty(index)" @edit="touch" />
          <BuilderQuestion
            v-else
            :question="block"
            :pages="later[index]"
            :picker="pending === block.uid"
            @settled="pending = null"
            @after="addQuestion(index + 1)"
            @remove="remove(index)"
            @cancel="cancel(index)"
            @page="toPage(index)"
            @outdent="onOutdent(index, $event)"
            @shortcut="onShortcut(index, $event)"
            @branch="onBranch(index)"
            @new-page="onNewPage"
            @edit="touch"
          />
        </div>
        <template v-if="lastOfPage(index)">
          <div class="nb-line nb-add">
            <button type="button" class="nb-ghost" @mousedown.prevent @click="addQuestion(index + 1)">+ Add question</button>
            <button v-if="index === form.blocks.length - 1" type="button" class="nb-ghost" @mousedown.prevent @click="addPage(index + 1)">+ Add page</button>
          </div>
          <BuilderActions :form="form" :page="pageAt(index)" :first="pageNumber(index) < 1" :last="index === form.blocks.length - 1" @edit="touch" />
        </template>
      </template>
      <BuilderGap :active="drag.over.value === form.blocks.length" @insert="addQuestion(form.blocks.length)" />
    </div>
    <div class="nb-tail" @click="onTail" />
    <BuilderTooltip :root="root" />
  </div>
</template>
