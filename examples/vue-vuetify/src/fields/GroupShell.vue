<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import { cloneVNode, useSlots } from 'vue';

const props = defineProps(controlShellProps);
const slots = useSlots();
const controls = () => {
  const nodes = slots.default?.() ?? [];
  return props.field.layout === 'inline' ? nodes.map((node) => cloneVNode(node, { inline: true })) : nodes;
};
</script>

<template>
  <fieldset v-bind="props.rootProps" class="group">
    <legend :id="`${props.f.id}-legend`" class="text-body-1 text-medium-emphasis">
      {{ props.f.label }}<span v-if="props.f.required" aria-hidden="true"> *</span>
    </legend>
    <div :class="{ group__scale: props.field.type === 'scale' }">
      <component :is="node" v-for="(node, index) in controls()" :key="index" />
      <div v-if="props.anchors.some(Boolean)" class="group__anchors text-caption">
        <span v-for="(anchor, index) in props.anchors" :key="index">{{ anchor?.label }}</span>
      </div>
    </div>
    <div v-if="props.f.helperText" :id="props.f.helperId" class="text-caption px-4">{{ props.f.helperText }}</div>
    <div v-if="props.f.error" :id="props.f.errorId" class="text-caption text-error px-4">{{ props.f.error }}</div>
  </fieldset>
</template>

<style scoped>
.group {
  min-width: 0;
  margin: 8px 0 16px;
  padding: 0;
  border: 0;
}

.group__scale {
  width: fit-content;
  max-width: 100%;
}

.group__anchors {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
</style>
