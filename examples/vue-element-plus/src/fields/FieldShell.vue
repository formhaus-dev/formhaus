<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { ElFormItem, ElText } from 'element-plus';
import type { PropType } from 'vue';

defineProps({
  id: { type: String, required: true },
  field: { type: Object as PropType<FormField>, required: true },
  error: String,
  kind: { type: String as PropType<'label' | 'inline' | 'group'>, default: 'label' },
});
</script>

<template>
  <ElFormItem
    :label="kind === 'inline' ? undefined : field.label"
    :for="kind === 'label' ? id : undefined"
    :error="error"
    label-position="top"
    data-fh="field"
    class="field"
  >
    <slot />
    <ElText v-if="field.helperText" :id="`${id}-helper`" size="small" type="info" class="field__helper">{{ field.helperText }}</ElText>
    <template #error="{ error: message }">
      <div :id="`${id}-error`" class="el-form-item__error field__error" role="alert">{{ message }}</div>
    </template>
  </ElFormItem>
</template>
