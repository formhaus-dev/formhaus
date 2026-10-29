<script setup lang="ts">
import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/vue';
import { computed, useAttrs } from 'vue';
import { VChip, VFileInput } from 'vuetify/components';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ f: FieldProps; multiple?: boolean }>();
const attrs = useAttrs();
const picker = computed(() => {
  const { 'onUpdate:modelValue': _, ...rest } = attrs;
  return rest;
});

function add(files: File | File[]) {
  const picked = ([] as File[]).concat(files);
  if (picked.length) props.f.change(addFiles(props.f.value, picked));
}
</script>

<template>
  <VFileInput v-if="!multiple" v-bind="attrs" />
  <template v-else>
    <VFileInput v-bind="picker" multiple :model-value="[]" @update:model-value="add" />
    <div v-if="fileEntries(f.value).length" class="d-flex flex-wrap ga-2 ps-10 mb-4">
      <VChip
        v-for="entry in fileEntries(f.value)"
        :key="entry.index"
        :model-value="true"
        closable
        :close-label="`Remove ${entry.name}`"
        :disabled="f.disabled"
        @update:model-value="f.change(removeFile(f.value, entry.index))"
      >
        {{ entry.name }}
      </VChip>
    </div>
  </template>
</template>
