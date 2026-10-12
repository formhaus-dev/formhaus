<script setup lang="ts">
import { computed } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { withDefaultFields } from './constants';
import type { CommitFieldEmits, FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits<CommitFieldEmits>();

const components = computed(() => withDefaultFields(props.components));
</script>

<template>
  <FieldResolver
    v-bind="props"
    :components="components"
    @update:model-value="(v: unknown) => emit('update:modelValue', v)"
    @commit="(v: unknown) => emit('commit', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
