<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import LucideIcon from './LucideIcon.vue';
import { choices, type StartChoice } from './onboarding';

const props = defineProps<{ field: FormField; modelValue?: unknown; error?: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: unknown]; commit: [value: unknown]; blur: []; focus: [] }>();
</script>

<template>
  <fieldset class="ob-choices">
    <legend class="lp-sr-only">{{ props.field.label }}</legend>
    <label v-for="option in props.field.options ?? []" :key="option.value" class="ob-choice">
      <input
        class="ob-choice__input"
        type="radio"
        :name="props.field.key"
        :value="option.value"
        :checked="props.modelValue === option.value"
        :disabled="props.disabled"
        @change="emit('update:modelValue', option.value)"
        @click="emit('commit', option.value)"
        @keydown.enter.prevent="emit('commit', option.value)"
        @focus="emit('focus')"
        @blur="emit('blur')"
      />
      <span class="ob-choice__icon"><LucideIcon :name="choices[option.value as StartChoice].icon" /></span>
      <span class="ob-choice__body">
        <span class="ob-choice__title">{{ option.label }}</span>
        <span class="ob-choice__text">{{ choices[option.value as StartChoice].text }}</span>
      </span>
    </label>
  </fieldset>
</template>

<style scoped>
.ob-choices {
  display: grid;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.ob-choice {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ob-choice:hover {
  border-color: var(--vp-c-text-3);
}

.ob-choice__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.ob-choice__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
  transition: color 0.2s, background-color 0.2s;
}

.ob-choice__body {
  display: grid;
  gap: 2px;
}

.ob-choice__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.ob-choice__text {
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}

.ob-choice:has(:checked) {
  border-color: var(--vp-c-brand-3);
  box-shadow: 0 0 0 1px var(--vp-c-brand-3);
}

.ob-choice:has(:checked) .ob-choice__icon {
  color: var(--vp-button-brand-text);
  background: var(--vp-c-brand-3);
}

.ob-choice:has(.ob-choice__input:focus-visible) {
  outline: 2px solid var(--vp-c-text-1);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .ob-choice,
  .ob-choice__icon {
    transition: none;
  }
}
</style>
