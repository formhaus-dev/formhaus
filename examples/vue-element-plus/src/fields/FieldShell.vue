<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import { ElFormItem, ElText } from 'element-plus';

defineProps(controlShellProps);
</script>

<template>
  <component :is="kind === 'group' ? 'fieldset' : 'div'" v-bind="rootProps" :class="['field', { 'field--inline': field.layout === 'inline' }]">
    <legend v-if="kind === 'group'" :class="['field__legend', { field__required: f.required }]">{{ f.label }}</legend>
    <ElFormItem :for="kind === 'input' ? f.id : undefined" :label="kind === 'input' ? f.label : undefined" :required="f.required" :error="f.error" label-position="top">
      <div v-if="kind === 'inline'" class="field__inline">
        <slot />
        <label :for="f.id" :class="{ field__required: f.required }">{{ f.label }}</label>
      </div>
      <div v-else-if="field.type === 'scale'" class="scale__frame">
        <slot />
        <div v-if="anchors.some(Boolean)" class="scale__anchors" aria-hidden="true">
          <span v-for="(anchor, index) in anchors" :key="index">{{ anchor?.label }}</span>
        </div>
      </div>
      <slot v-else />
      <ElText v-if="f.helperText" :id="f.helperId" size="small" type="info" class="field__helper">{{ f.helperText }}</ElText>
      <template #error="{ error }">
        <div :id="f.errorId" class="el-form-item__error field__error" role="alert">{{ error }}</div>
      </template>
    </ElFormItem>
  </component>
</template>
