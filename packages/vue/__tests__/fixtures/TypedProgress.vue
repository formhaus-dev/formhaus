<script setup lang="ts">
import { formStepProgressProps } from '@formhaus/vue';

const props = defineProps(formStepProgressProps);
</script>

<template>
  <p data-testid="progress">{{ props.current }}/{{ props.total }} h{{ props.headingLevel }}</p>
</template>
