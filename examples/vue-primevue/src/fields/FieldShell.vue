<script setup lang="ts">
import { controlShellProps } from '@formhaus/vue/controls';
import Message from 'primevue/message';

defineProps(controlShellProps);
</script>

<template>
  <component :is="kind === 'group' ? 'fieldset' : 'div'" v-bind="rootProps" :class="['field', { 'field--inline': field.layout === 'inline' }]">
    <legend v-if="kind === 'group'" class="field__label">
      {{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span>
    </legend>
    <label v-if="kind === 'input'" :id="`${f.id}-label`" :for="f.id" class="field__label">
      {{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span>
    </label>
    <div v-if="kind === 'inline'" class="field__inline">
      <slot />
      <label :for="f.id">{{ f.label }}<span v-if="f.required" aria-hidden="true"> *</span></label>
    </div>
    <div v-else-if="field.type === 'scale'" class="scale__frame">
      <slot />
      <div v-if="anchors.some(Boolean)" class="scale__anchors" aria-hidden="true">
        <span v-for="(anchor, index) in anchors" :key="index">{{ anchor?.label }}</span>
      </div>
    </div>
    <slot v-else />
    <Message v-if="f.helperText" :pt="{ root: { id: f.helperId, role: null, 'aria-live': null } }" size="small" severity="secondary" variant="simple">
      {{ f.helperText }}
    </Message>
    <Message v-if="f.error" :pt="{ root: { id: f.errorId } }" size="small" severity="error" variant="simple">{{ f.error }}</Message>
  </component>
</template>
