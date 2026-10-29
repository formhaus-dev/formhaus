<script setup lang="ts">
import { getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, isFileList, removeFile } from '@formhaus/core/fields';
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import type { ControlRootProps } from '@formhaus/vue/controls';
import Button from 'primevue/button';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import Message from 'primevue/message';
import { computed, ref } from 'vue';
import FieldShell from './FieldShell.vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
const list = computed(() => isFileList(props.field));
const file = computed(() => (f.value instanceof File ? f.value : null));
const entries = computed(() => (list.value ? fileEntries(f.value) : []));
const chooseLabel = computed(() => (list.value ? 'Add files' : file.value ? 'Replace file' : 'Choose file'));
const fileLabel = computed(() => (list.value ? (entries.value.length ? '' : 'No files chosen') : (file.value?.name ?? 'No file chosen')));
const max = computed(() => fileLimit(props.field));
const full = computed(() => list.value && addFiles(f.value, []).length >= max.value);
const notice = ref('');
const root = { 'data-fh': 'field' } as ControlRootProps;

function select(event: FileUploadSelectEvent) {
  const files = event.files as File[];
  if (!list.value) return f.change(files[files.length - 1] ?? null);
  const next = addFiles(f.value, files, max.value);
  notice.value =
    next.length < addFiles(f.value, files).length
      ? (props.field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max: max.value }))
      : '';
  f.change(next);
}

function remove(index: number) {
  notice.value = '';
  f.change(removeFile(f.value, index));
}
</script>

<template>
  <FieldShell kind="group" :field="field" :f="f" :root-props="root" :anchors="[]">
    <div class="file">
      <FileUpload
        mode="basic"
        :name="f.name"
        :accept="field.accept"
        :multiple="list"
        :choose-label="chooseLabel"
        :choose-button-props="{ id: f.id, severity: f.invalid ? 'danger' : 'secondary', outlined: true, ...f.aria, 'data-testid': f.testId, onBlur: f.blur, onFocus: f.focus }"
        :disabled="f.disabled || full"
        custom-upload
        @select="select"
      >
        <template #filelabel>
          <span class="file__name">{{ fileLabel }}</span>
        </template>
      </FileUpload>
      <Button v-if="file" label="Remove" severity="secondary" variant="text" size="small" :disabled="f.disabled" @click="f.change(null)" />
    </div>
    <ul v-if="entries.length" class="files">
      <li v-for="entry in entries" :key="entry.index" class="file">
        <span class="file__name">{{ entry.name }}</span>
        <Button
          label="Remove"
          :aria-label="`Remove ${entry.name}`"
          severity="secondary"
          variant="text"
          size="small"
          :disabled="f.disabled"
          @click="remove(entry.index)"
        />
      </li>
    </ul>
    <Message v-if="notice" size="small" severity="secondary" variant="simple">{{ notice }}</Message>
  </FieldShell>
</template>
