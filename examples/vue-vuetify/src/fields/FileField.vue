<script setup lang="ts">
import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/vue';
import { computed, ref, useAttrs } from 'vue';
import { VChip, VFileInput } from 'vuetify/components';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ f: FieldProps; field: FormField; multiple?: boolean }>();
const attrs = useAttrs();
const picker = computed(() => {
  const { 'onUpdate:modelValue': _, ...rest } = attrs;
  return rest;
});
const full = computed(() => filesFull(props.field, props.f.value));
const notice = ref('');
const status = ref('');

function add(files: File | File[]) {
  const picked = ([] as File[]).concat(files);
  if (!picked.length) return;
  const result = pickFiles(props.field, props.f.value, picked);
  if (result.value) props.f.change(result.value);
  notice.value = result.notice;
  status.value = result.status;
}

function remove(index: number, name: string) {
  notice.value = '';
  props.f.change(removeFile(props.f.value, index));
  status.value = `${name} removed`;
}
</script>

<template>
  <VFileInput v-if="!multiple" v-bind="attrs" />
  <template v-else>
    <VFileInput v-bind="picker" multiple :disabled="f.disabled || full" :model-value="[]" @update:model-value="add" />
    <div v-if="fileEntries(f.value).length" class="d-flex flex-wrap ga-2 ps-10 mb-4">
      <VChip
        v-for="entry in fileEntries(f.value)"
        :key="entry.index"
        :model-value="true"
        closable
        :close-label="`Remove ${entry.name}`"
        :disabled="f.disabled"
        @update:model-value="remove(entry.index, entry.name)"
      >
        <span dir="auto">{{ entry.name }}</span>
      </VChip>
    </div>
    <div v-if="notice" class="text-caption text-medium-emphasis ps-10 mb-4">{{ notice }}</div>
    <p class="d-sr-only" role="status">{{ status }}</p>
  </template>
</template>
