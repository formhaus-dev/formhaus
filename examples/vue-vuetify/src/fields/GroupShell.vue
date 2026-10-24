<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';

const props = defineProps(controlShellProps);
</script>

<template>
  <fieldset v-bind="props.rootProps" class="group">
    <legend class="text-body-1 text-medium-emphasis">
      {{ props.f.label }}<span v-if="props.f.required" aria-hidden="true"> *</span>
    </legend>
    <slot />
    <div v-if="props.anchors.some(Boolean)" class="group__anchors text-caption">
      <span v-for="(anchor, index) in props.anchors" :key="index">{{ anchor?.label }}</span>
    </div>
    <div v-if="props.f.helperText" :id="props.f.helperId" class="text-caption">{{ props.f.helperText }}</div>
    <div v-if="props.f.error" :id="props.f.errorId" class="text-caption text-error">{{ props.f.error }}</div>
  </fieldset>
</template>

<style scoped>
.group {
  min-width: 0;
  margin: 8px 0 16px;
  padding: 0;
  border: 0;
}

.group :deep(.v-selection-control-group--inline) {
  justify-content: space-between;
}

.group__anchors {
  display: flex;
  justify-content: space-between;
}
</style>
