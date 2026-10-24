<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import { ElText } from 'element-plus';

defineProps(controlShellProps);
</script>

<template>
  <div v-bind="rootProps" class="matrix__row">
    <div class="matrix__label">
      <span :id="`${f.id}-label`" :class="{ field__required: f.required }">{{ f.label }}</span>
      <ElText v-if="f.helperText" :id="f.helperId" tag="div" size="small" type="info">{{ f.helperText }}</ElText>
    </div>
    <slot />
    <div v-if="f.error" :id="f.errorId" class="matrix__error el-form-item__error" role="alert">{{ f.error }}</div>
  </div>
</template>
