<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import { ElFormItem, ElText } from 'element-plus';

defineProps(controlShellProps);
</script>

<template>
  <component :is="kind === 'group' ? 'fieldset' : 'div'" v-bind="rootProps" :class="['field', { 'field--inline': field.layout === 'inline' }]">
    <legend v-if="kind === 'group'" class="field__legend">
      {{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span>
    </legend>
    <ElFormItem :for="kind === 'input' ? f.id : undefined" :error="f.error" label-position="top">
      <template v-if="kind === 'input'" #label>
        {{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span>
      </template>
      <div v-if="kind === 'inline'" class="field__inline">
        <slot />
        <label :for="f.id">{{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span></label>
      </div>
      <slot v-else />
      <div v-if="anchors.some(Boolean)" class="scale__anchors" aria-hidden="true">
        <span v-for="(anchor, index) in anchors" :key="index">{{ anchor?.label }}</span>
      </div>
      <ElText v-if="f.helperText" :id="f.helperId" size="small" type="info" class="field__helper">{{ f.helperText }}</ElText>
      <template #error="{ error }">
        <div :id="f.errorId" class="el-form-item__error field__error" role="alert">{{ error }}</div>
      </template>
    </ElFormItem>
  </component>
</template>
