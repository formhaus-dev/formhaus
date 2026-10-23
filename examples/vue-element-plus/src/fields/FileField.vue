<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import { ElButton, ElUpload, type UploadFile } from 'element-plus';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const files = computed(() => (props.modelValue instanceof File ? [{ name: props.modelValue.name }] : []));

function change(file: UploadFile) {
  emit('update:modelValue', file.raw ?? null);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="group">
    <ElUpload
      :file-list="files"
      :accept="field.accept"
      :auto-upload="false"
      :disabled="disabled || loading"
      :on-change="change"
      :on-remove="() => emit('update:modelValue', null)"
      class="file"
    >
      <template #trigger>
        <ElButton
          :id="id"
          :type="error ? 'danger' : 'default'"
          plain
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy(id, field, error)"
          :disabled="disabled || loading"
          :data-testid="testId"
          @blur="emit('blur')"
          @focus="emit('focus')"
        >
          {{ files.length ? 'Replace file' : 'Choose file' }}
        </ElButton>
      </template>
    </ElUpload>
  </FieldShell>
</template>
