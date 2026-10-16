<script setup lang="ts">
import { formActionsEmits, formActionsProps } from '@formhaus/vue';

const props = defineProps(formActionsProps);
const emit = defineEmits(formActionsEmits);
</script>

<template>
  <button v-if="props.showBack" type="button" :data-variant="props.backAction ? props.backAction.variant : 'none'" @click="emit('prev')">
    {{ props.backLabel }}
  </button>
  <button type="button" :disabled="props.loading" @click="emit('primary')">{{ props.primaryLabel }}</button>
</template>
