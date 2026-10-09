<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import AutoInput from './AutoInput.vue';
import BuilderMenu from './BuilderMenu.vue';
import BuilderOptions from './BuilderOptions.vue';
import LucideIcon from './LucideIcon.vue';
import {
  QUESTION_TYPES, TYPE_ITEMS, hasOptions, placeholderFor, setType, typeLabel,
  type BuilderOption, type BuilderQuestion, type QuestionType,
} from './builder-model';
import { inferType, questionSlash, shortcut, slashQuery, type Shortcut } from './builder-smart';

const props = defineProps<{ question: BuilderQuestion; pages: { uid: string; title: string }[]; picker?: boolean }>();
const emit = defineEmits<{
  after: []; remove: []; cancel: []; page: []; settled: []; outdent: [position: number];
  shortcut: [shortcut: Shortcut]; newPage: [option: BuilderOption]; branch: []; edit: [];
}>();

const root = ref<HTMLElement>();
const textAnchor = ref<HTMLElement>();
const typeAnchor = ref<HTMLElement>();
const menu = ref<'slash' | 'type' | null>(null);
const picking = ref(false);
const slashRef = ref<InstanceType<typeof BuilderMenu>>();
const dismissed = ref(false);
const icon = computed(() => QUESTION_TYPES.find((item) => item.type === props.question.type)?.icon ?? 'type');
const query = computed(() => (picking.value ? props.question.label.replace(/^\//, '') : slashQuery(props.question.label) ?? ''));
const suggestion = computed(() => {
  if (dismissed.value || props.question.type !== 'text') return undefined;
  const type = inferType(props.question.label);
  return type && type !== 'text' ? type : undefined;
});

async function focus(selector = '.nb-question .auto__input') {
  await nextTick();
  const input = root.value?.querySelector<HTMLInputElement>(selector);
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
}

function openPicker() {
  picking.value = true;
  menu.value = 'slash';
  focus();
}

onMounted(() => { if (props.picker) openPicker(); });
watch(() => props.picker, (next) => { if (next) openPicker(); });

function apply(type: QuestionType) {
  setType(props.question, type);
  dismissed.value = type !== 'text';
  emit('edit');
}

function settle() {
  picking.value = false;
  menu.value = null;
  emit('settled');
}

function onInput() {
  emit('edit');
  if (picking.value) {
    if (!questionSlash(query.value).length) settle();
    return;
  }
  const found = shortcut(props.question.label);
  if (found) {
    props.question.label = '';
    return emit('shortcut', found);
  }
  menu.value = slashQuery(props.question.label) !== null ? 'slash' : menu.value === 'slash' ? null : menu.value;
}

function onTitleKey(event: KeyboardEvent) {
  if (menu.value === 'slash' && slashRef.value?.onKey(event)) return;
  const input = event.target as HTMLInputElement;
  const firstEmpty = hasOptions(props.question.type) && props.question.options[0] && !props.question.options[0].label;
  if (event.key === 'ArrowRight' && suggestion.value && input.selectionStart === input.value.length) {
    event.preventDefault();
    apply(suggestion.value);
  } else if (event.key === 'Escape' && suggestion.value) {
    event.preventDefault();
    dismissed.value = true;
  } else if (event.key === 'Tab' && !event.shiftKey && hasOptions(props.question.type)) {
    event.preventDefault();
    focus('.nb-option .auto__input');
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (firstEmpty) focus('.nb-option .auto__input');
    else emit('after');
  } else if (event.key === 'Backspace' && !props.question.label) {
    event.preventDefault();
    emit('remove');
  }
}

function pickSlash(id: string) {
  props.question.label = '';
  settle();
  if (id === 'page') return emit('page');
  apply(id as QuestionType);
  focus();
}

function closeSlash(blurred = false) {
  const cancel = picking.value && !props.question.label;
  settle();
  if (cancel) return emit(blurred ? 'cancel' : 'remove');
  if (!blurred) focus();
}

function pickType(id: string) {
  menu.value = null;
  apply(id as QuestionType);
  focus(hasOptions(id as QuestionType) && !props.question.options[0]?.label ? '.nb-option .auto__input' : undefined);
}
</script>

<template>
  <div ref="root" class="nb-block" :data-uid="question.uid">
    <div class="nb-line nb-question">
      <span ref="textAnchor" class="nb-anchor nb-anchor--text">
        <AutoInput
          v-model="question.label"
          :placeholder="picking ? 'Pick a type, or type to filter' : placeholderFor(question.type)"
          label="Question"
          @keydown="onTitleKey"
          @input="onInput"
          @blur="picking && closeSlash(true)"
        />
        <BuilderMenu
          v-if="menu === 'slash'"
          :id="`${question.uid}-slash`"
          ref="slashRef"
          :items="questionSlash(query)"
          :anchor="textAnchor"
          label="Question types"
          passive
          @pick="pickSlash"
          @close="closeSlash"
        />
      </span>
      <template v-if="!picking">
        <span ref="typeAnchor" class="nb-anchor">
          <button type="button" class="nb-tag" data-tip="Click to change type" :aria-label="`Type: ${typeLabel(question.type)}. Change type`" :aria-expanded="menu === 'type'" @click="menu = 'type'">
            <LucideIcon :name="icon" />
            {{ typeLabel(question.type) }}
            <LucideIcon name="chevron-down" class="nb-tag__chevron" />
          </button>
          <BuilderMenu v-if="menu === 'type'" :id="`${question.uid}-type`" :items="TYPE_ITEMS" :current="question.type" :anchor="typeAnchor" label="Question type" @pick="pickType" @close="menu = null; focus()" />
        </span>
        <button
          type="button"
          class="nb-tag"
          :class="{ 'nb-tag--ghost': !question.required }"
          :data-tip="question.required ? 'Click to make optional' : 'Click to make required'"
          :aria-pressed="question.required"
          aria-label="Required"
          @click="question.required = !question.required; emit('edit')"
        >
          <LucideIcon name="asterisk" />
          Required
        </button>
        <button type="button" class="nb-tool nb-tool--ghost" data-tip="Delete question" aria-label="Delete question" @mousedown.prevent @click="emit('remove')">
          <LucideIcon name="x" />
        </button>
        <button v-if="suggestion" type="button" class="nb-suggest" data-tip="Press → at the end of the text to accept" @click="apply(suggestion); focus()">
          {{ typeLabel(suggestion) }}? <kbd>→</kbd>
        </button>
      </template>
    </div>
    <BuilderOptions v-if="hasOptions(question.type)" :question="question" :pages="pages" @outdent="emit('outdent', $event)" @edit="emit('edit')" @branch="emit('branch')" @new-page="emit('newPage', $event)" />
  </div>
</template>
