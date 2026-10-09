<script setup lang="ts">
import { computed } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { withDefaultFields } from './constants';
import type { FieldEmits, FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits<FieldEmits>();

const components = computed(() => withDefaultFields(props.components));
</script>

<template>
  <FieldResolver
    v-bind="props"
    :components="components"
    @update:value="(v: unknown) => emit('update:value', v)"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
