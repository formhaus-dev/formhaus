<script setup lang="ts">
import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile } from '@formhaus/core/fields';
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
const max = computed(() => fileLimit(props.field));
const full = computed(() => addFiles(props.f.value, []).length >= max.value);
const notice = ref('');

function add(files: File | File[]) {
  const picked = ([] as File[]).concat(files);
  if (!picked.length) return;
  const next = addFiles(props.f.value, picked, max.value);
  notice.value =
    next.length < addFiles(props.f.value, picked).length
      ? (props.field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max: max.value }))
      : '';
  props.f.change(next);
}

function remove(index: number) {
  notice.value = '';
  props.f.change(removeFile(props.f.value, index));
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
        @update:model-value="remove(entry.index)"
      >
        {{ entry.name }}
      </VChip>
    </div>
    <div v-if="notice" class="text-caption text-medium-emphasis ps-10 mb-4">{{ notice }}</div>
  </template>
</template>
