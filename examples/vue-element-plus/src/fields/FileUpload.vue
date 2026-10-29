<script setup lang="ts">
import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile } from '@formhaus/core/fields';
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
const max = computed(() => fileLimit(props.field));
const full = computed(() => addFiles(props.f.value, []).length >= max.value);
const notice = ref('');
let pending: unknown[] = [];

function add(file: UploadFile) {
  if (!pending.length) queueMicrotask(() => (pending = []));
  pending.push(file.raw);
  const next = addFiles(props.f.value, pending, max.value);
  notice.value =
    next.length < addFiles(props.f.value, pending).length
      ? (props.field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max: max.value }))
      : '';
  props.f.change(next);
}

function remove(index: number) {
  notice.value = '';
  props.f.change(removeFile(props.f.value, index));
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
        <span class="files__name">{{ entry.name }}</span>
        <ElButton link type="danger" :aria-label="`Remove ${entry.name}`" :disabled="f.disabled" @click="remove(entry.index)">Remove</ElButton>
      </li>
    </ul>
    <ElText v-if="notice" class="files__notice" type="info" size="small">{{ notice }}</ElText>
  </template>
</template>
