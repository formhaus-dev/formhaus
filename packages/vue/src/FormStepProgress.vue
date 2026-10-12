<script setup lang="ts">
import type { FormStepProgressProps } from './types';

const props = withDefaults(defineProps<FormStepProgressProps>(), { headingLevel: 2 });
</script>

<template>
  <div class="fh-step-progress">
    <div class="fh-step-progress__bar">
      <div
        class="fh-step-progress__fill"
        :style="{ width: `${(props.current / props.total) * 100}%` }"
      />
    </div>
    <div class="fh-step-progress__info">
      <span class="fh-step-progress__counter">Step {{ props.current }} of {{ props.total }}</span>
    </div>
    <component :is="`h${props.headingLevel}`" v-if="props.stepTitle" class="fh-step-progress__title">{{ props.stepTitle }}</component>
    <p v-if="props.stepDescription" class="fh-step-progress__description">{{ props.stepDescription }}</p>
  </div>
</template>
