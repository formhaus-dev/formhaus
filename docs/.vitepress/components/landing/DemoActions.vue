<script setup lang="ts">
import { inject, watch, type Ref } from 'vue';
import { FormActions } from '@formhaus/vue';

defineOptions({ inheritAttrs: false });
const emit = defineEmits<{ submit: []; next: []; prev: []; cancel: []; skip: []; primary: []; action: [name: string] }>();
const advance = inject<Ref<number>>('demo-advance');

watch(() => advance?.value, (next, prev) => {
  if (next && next !== prev) emit('next');
});
</script>

<template>
  <FormActions
    v-bind="$attrs"
    @submit="emit('submit')"
    @next="emit('next')"
    @prev="emit('prev')"
    @cancel="emit('cancel')"
    @skip="emit('skip')"
    @primary="emit('primary')"
    @action="(name: string) => emit('action', name)"
  />
</template>
