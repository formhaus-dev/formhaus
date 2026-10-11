<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ placeholder: string; label: string; selectOnFocus?: boolean; wrap?: boolean }>();
const model = defineModel<string>({ required: true });
const emit = defineEmits<{ keydown: [event: KeyboardEvent]; input: []; blur: [] }>();
const input = ref<HTMLInputElement>();

function onWrapKey(event: KeyboardEvent) {
  emit('keydown', event);
  if (event.key === 'Enter') event.preventDefault();
}

</script>

<template>
  <span class="auto" :class="{ 'auto--wrap': wrap }">
    <span class="auto__mirror" aria-hidden="true">{{ model || placeholder }}{{ wrap ? ' ' : '' }}</span>
    <textarea
      v-if="wrap"
      v-model="model"
      class="auto__input"
      rows="1"
      autocomplete="off"
      :placeholder="placeholder"
      :aria-label="label"
      @keydown="onWrapKey"
      @input="emit('input')"
      @blur="emit('blur')"
    />
    <input
      v-else
      ref="input"
      v-model="model"
      class="auto__input"
      type="text"
      size="1"
      autocomplete="off"
      :placeholder="placeholder"
      :aria-label="label"
      @keydown="emit('keydown', $event)"
      @input="emit('input')"
      @blur="emit('blur')"
      @focus="selectOnFocus && input?.select()"
    />
  </span>
</template>

<style scoped>
.auto {
  display: inline-grid;
  min-width: 0;
  max-width: 100%;
}

.auto__mirror,
.auto__input {
  grid-area: 1 / 1;
  min-width: 1ch;
  padding: 0;
  border: 0;
  font: inherit;
  letter-spacing: inherit;
  white-space: pre;
}

.auto__mirror {
  overflow: hidden;
  visibility: hidden;
}

.auto__input {
  width: 100%;
  color: inherit;
  background: transparent;
  outline: none;
  caret-color: var(--vp-c-brand-1);
}

.auto--wrap {
  display: grid;
  width: 100%;
}

.auto--wrap .auto__mirror,
.auto--wrap .auto__input {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.auto--wrap .auto__input {
  overflow: hidden;
  resize: none;
}

.auto__input::placeholder {
  color: var(--vp-c-text-3);
}
</style>
