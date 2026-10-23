<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
import Button from 'primevue/button';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';
import { describedBy } from './field';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const id = computed(() => props.id ?? props.field.key);
const file = computed(() => (props.modelValue instanceof File ? props.modelValue : null));

function select(event: FileUploadSelectEvent) {
  const files = event.files as File[];
  emit('update:modelValue', files[files.length - 1] ?? null);
}
</script>

<template>
  <FieldShell :id="id" :field="field" :error="error" kind="fieldset">
    <div class="file">
      <FileUpload
        mode="basic"
        :name="field.key"
        :accept="field.accept"
        :choose-label="file ? 'Replace file' : 'Choose file'"
        :choose-button-props="{
          id,
          severity: error ? 'danger' : 'secondary',
          outlined: true,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy(id, field, error),
          'data-testid': testId,
        }"
        :disabled="disabled || loading"
        custom-upload
        @select="select"
      >
        <template #filelabel>
          <span class="file__name">{{ file?.name ?? 'No file chosen' }}</span>
        </template>
      </FileUpload>
      <Button
        v-if="file"
        label="Remove"
        severity="secondary"
        variant="text"
        size="small"
        :disabled="disabled || loading"
        @click="emit('update:modelValue', null)"
      />
    </div>
  </FieldShell>
</template>
