<script setup lang="ts">
import { addFiles, fileEntries, fileNames, isFileList, nextRemove, removeFile } from '@formhaus/core/fields';
import { computed, nextTick, ref } from 'vue';
import { useLabel } from '../composables/useLabel';
import { fieldComponentProps } from '../props';
import type { FieldEmits } from '../types';
import FieldShell from './FieldShell.vue';
import { useField } from './useField';

const props = defineProps(fieldComponentProps);
const emit = defineEmits<FieldEmits>();
const { input } = useField(props, emit);
const text = useLabel();
const list = computed(() => isFileList(props.field));
const entries = computed(() => fileEntries(props.modelValue));
const status = ref('');
const picker = ref<HTMLInputElement>();
const items = ref<HTMLUListElement>();

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  emit('update:modelValue', files && files.length > 0 ? files[0] : null);
}

function onFilesAdd(event: Event) {
  const target = event.target as HTMLInputElement;
  const picked = Array.from(target.files ?? []);
  target.value = '';
  if (picked.length === 0) return;
  emit('update:modelValue', addFiles(props.modelValue, picked));
  status.value = text('itemAdded', { item: fileNames(picked) });
}

async function onRemove(index: number, position: number, name: string) {
  emit('update:modelValue', removeFile(props.modelValue, index));
  status.value = text('itemRemoved', { item: name });
  await nextTick();
  (nextRemove(items.value, position) ?? picker.value)?.focus();
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
      <p class="fh-file-list__status" role="status">{{ status }}</p>
    </template>
  </FieldShell>
</template>
