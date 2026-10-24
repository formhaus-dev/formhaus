<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';

const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
const f = useFieldProps(props, emit);
</script>

<template>
  <div data-fh="field">
    <v-file-input
      :id="f.id"
      :name="f.name"
      :accept="field.accept"
      :label="f.label"
      :disabled="f.disabled"
      :aria-required="f.input['aria-required']"
      :aria-invalid="f.input['aria-invalid']"
      :error-messages="f.error"
      :hint="f.helperText"
      :persistent-hint="!!f.helperText"
      :data-testid="f.testId"
      @update:model-value="(files: File | File[]) => f.change([files].flat()[0] ?? null)"
      @blur="f.blur"
      @focus="f.focus"
    />
  </div>
</template>
