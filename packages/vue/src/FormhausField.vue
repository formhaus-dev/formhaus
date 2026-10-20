<script setup lang="ts">
import { computed } from 'vue';
import FieldResolver from './FieldResolver.vue';
import { fieldDomId } from '@formhaus/core/internal';
import { useFormId } from './composables/useFormId';
import { withDefaultFields } from './constants';
import { fieldComponentEmits } from './props';
import type { FieldResolverProps } from './types';

const props = defineProps<FieldResolverProps>();
const emit = defineEmits(fieldComponentEmits);

const components = computed(() => withDefaultFields(props.components));
const fallbackId = useFormId();
</script>

<template>
  <FieldResolver
    v-bind="props"
    :id="props.id ?? fieldDomId(fallbackId, props.field.key)"
    :components="components"
    @update:model-value="(v: unknown) => emit('update:modelValue', v)"
    @commit="(v: unknown) => { emit('commit', v); emit('update:modelValue', v); }"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
