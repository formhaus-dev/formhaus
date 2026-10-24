<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import type { ControlRootProps } from '@formhaus/vue/controls';
import Button from 'primevue/button';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import { computed } from 'vue';
import FieldShell from './FieldShell.vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
const file = computed(() => (f.value instanceof File ? f.value : null));
const root = { 'data-fh': 'field' } as ControlRootProps;

function select(event: FileUploadSelectEvent) {
  const files = event.files as File[];
  f.change(files[files.length - 1] ?? null);
}
</script>

<template>
  <FieldShell kind="group" :field="field" :f="f" :root-props="root" :anchors="[]">
    <div class="file">
      <FileUpload
        mode="basic"
        :name="f.name"
        :accept="field.accept"
        :choose-label="file ? 'Replace file' : 'Choose file'"
        :choose-button-props="{ id: f.id, severity: f.invalid ? 'danger' : 'secondary', outlined: true, ...f.aria, 'data-testid': f.testId, onBlur: f.blur, onFocus: f.focus }"
        :disabled="f.disabled"
        custom-upload
        @select="select"
      >
        <template #filelabel>
          <span class="file__name">{{ file?.name ?? 'No file chosen' }}</span>
        </template>
      </FileUpload>
      <Button v-if="file" label="Remove" severity="secondary" variant="text" size="small" :disabled="f.disabled" @click="f.change(null)" />
    </div>
  </FieldShell>
</template>
