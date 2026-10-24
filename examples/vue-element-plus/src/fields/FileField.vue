<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import type { ControlRootProps } from '@formhaus/vue/controls';
import { ElButton, ElUpload, type UploadFile } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
const files = computed(() => (f.value instanceof File ? [{ name: f.value.name }] : []));
const root = { 'data-fh': 'field' } as ControlRootProps;
</script>

<template>
  <FieldShell kind="group" :field="field" :f="f" :root-props="root">
    <ElUpload
      :file-list="files"
      :accept="field.accept"
      :auto-upload="false"
      :disabled="f.disabled"
      :on-change="(file: UploadFile) => f.change(file.raw ?? null)"
      :on-remove="() => f.change(null)"
      class="file"
    >
      <template #trigger>
        <ElButton :id="f.id" :type="f.invalid ? 'danger' : 'default'" plain v-bind="f.aria" :disabled="f.disabled" :data-testid="f.testId" @blur="f.blur" @focus="f.focus">
          {{ files.length ? 'Replace file' : 'Choose file' }}
        </ElButton>
      </template>
    </ElUpload>
  </FieldShell>
</template>
