<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';

defineProps(fieldComponentProps);
defineEmits(fieldComponentEmits);
</script>

<template>
  <input :id="id" type="hidden" :name="field.key" :value="modelValue ?? ''" />
</template>
