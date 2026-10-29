<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/vue';
import { ElButton, ElText, ElUpload, type UploadFile } from 'element-plus';
import { computed, ref, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ f: FieldProps; field: FormField; multiple?: boolean }>();
const attrs = useAttrs();
const picker = computed(() => {
  const { onChange: _, onRemove: __, fileList: ___, ...rest } = attrs;
  return rest;
});
const entries = computed(() => fileEntries(props.f.value));
const full = computed(() => filesFull(props.field, props.f.value));
const notice = ref('');
const status = ref('');
let pending: unknown[] = [];

function add(file: UploadFile) {
  if (!pending.length) queueMicrotask(() => (pending = []));
  pending.push(file.raw);
  const result = pickFiles(props.field, props.f.value, pending);
  if (result.value) props.f.change(result.value);
  notice.value = result.notice;
  status.value = result.status;
}

function remove(index: number, name: string) {
  notice.value = '';
  props.f.change(removeFile(props.f.value, index));
  status.value = `${name} removed`;
}
</script>

<template>
  <ElUpload v-if="!multiple" v-bind="attrs"><slot /></ElUpload>
  <template v-else>
    <ElUpload v-bind="picker" multiple :disabled="f.disabled || full" :file-list="[]" :show-file-list="false" :on-change="add">
      <ElButton v-bind="f.attrs" :disabled="f.disabled || full" :type="f.invalid ? 'danger' : 'default'" plain>Add files</ElButton>
    </ElUpload>
    <ul v-if="entries.length" class="files">
      <li v-for="entry in entries" :key="entry.index" class="files__item">
        <span class="files__name" dir="auto">{{ entry.name }}</span>
        <ElButton link type="danger" :aria-label="`Remove ${entry.name}`" :disabled="f.disabled" @click="remove(entry.index, entry.name)">Remove</ElButton>
      </li>
    </ul>
    <ElText v-if="notice" class="files__notice" type="info" size="small">{{ notice }}</ElText>
    <p class="sr-only" role="status">{{ status }}</p>
  </template>
</template>
