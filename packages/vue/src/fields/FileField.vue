<script setup lang="ts">
import { fileEntries, isFileList, removeFile } from '@formhaus/core/fields';
import { filesFull, nextRemove, pickFiles } from '@formhaus/core/internal';
import { computed, nextTick, ref } from 'vue';
import { useFileLimit, useLabel } from '../composables/useLabel';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
const text = useLabel();
const limit = useFileLimit();
const list = computed(() => isFileList(props.field));
const entries = computed(() => fileEntries(props.modelValue));
const status = ref('');
const notice = ref('');
const full = computed(() => filesFull(props.field, props.modelValue));
const picker = ref<HTMLInputElement>();
const items = ref<HTMLUListElement>();

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  emit('update:modelValue', files && files.length > 0 ? files[0] : null);
}

async function focusAfter(position: number | null) {
  if (position === null) return;
  await nextTick();
  (nextRemove(items.value, position) ?? picker.value)?.focus();
}

function onFilesAdd(event: Event) {
  const target = event.target as HTMLInputElement;
  const picked = Array.from(target.files ?? []);
  target.value = '';
  if (picked.length === 0) return;
  const result = pickFiles(props.field, props.modelValue, picked, text, limit);
  if (result.value) emit('update:modelValue', result.value);
  status.value = result.status;
  notice.value = result.notice;
  void focusAfter(result.focus);
}

function onRemove(index: number, position: number, name: string) {
  emit('update:modelValue', removeFile(props.modelValue, index));
  status.value = text('itemRemoved', { item: name });
  notice.value = '';
  void focusAfter(position);
}
</script>

<template>
  <FieldShell :id="props.id" :field="props.field" :error="props.error">
    <input v-if="!list" v-bind="input" class="fh-field__input" type="file" :accept="props.field.accept" @change="onFileChange" />
    <template v-else>
      <input
        ref="picker"
        v-bind="input"
        class="fh-field__input fh-field__input--files"
        type="file"
        multiple
        :disabled="input.disabled || full"
        :accept="props.field.accept"
        @change="onFilesAdd"
      />
      <ul v-if="entries.length" ref="items" class="fh-file-list">
        <li v-for="(entry, position) in entries" :key="entry.index" class="fh-file-list__item">
          <span class="fh-file-list__name">{{ entry.name }}</span>
          <button
            type="button"
            class="fh-form-actions__button fh-form-actions__button--text fh-file-list__remove"
            :aria-label="text('removeItemNamed', { label: text('removeItem'), item: entry.name })"
            :disabled="props.disabled || props.loading"
            @click="onRemove(entry.index, position, entry.name)"
          >
            {{ text('removeItem') }}
          </button>
        </li>
      </ul>
      <p v-if="notice" class="fh-field__helper fh-file-list__notice">{{ notice }}</p>
      <p class="fh-file-list__status" role="status">{{ status }}</p>
    </template>
  </FieldShell>
</template>
