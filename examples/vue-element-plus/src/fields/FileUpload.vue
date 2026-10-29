<script setup lang="ts">
import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/vue';
import { ElButton, ElUpload, type UploadFile } from 'element-plus';
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ f: FieldProps; multiple?: boolean }>();
const attrs = useAttrs();
const picker = computed(() => {
  const { onChange: _, onRemove: __, fileList: ___, ...rest } = attrs;
  return rest;
});
const entries = computed(() => fileEntries(props.f.value));
let batch: unknown;

function add(file: UploadFile) {
  if (batch === undefined) queueMicrotask(() => (batch = undefined));
  batch = addFiles(batch ?? props.f.value, file.raw);
  props.f.change(batch);
}
</script>

<template>
  <ElUpload v-if="!multiple" v-bind="attrs"><slot /></ElUpload>
  <template v-else>
    <ElUpload v-bind="picker" multiple :file-list="[]" :show-file-list="false" :on-change="add">
      <ElButton v-bind="f.attrs" :type="f.invalid ? 'danger' : 'default'" plain>Add files</ElButton>
    </ElUpload>
    <ul v-if="entries.length" class="files">
      <li v-for="entry in entries" :key="entry.index" class="files__item">
        <span class="files__name">{{ entry.name }}</span>
        <ElButton
          link
          type="danger"
          :aria-label="`Remove ${entry.name}`"
          :disabled="f.disabled"
          @click="f.change(removeFile(f.value, entry.index))"
        >
          Remove
        </ElButton>
      </li>
    </ul>
  </template>
</template>
