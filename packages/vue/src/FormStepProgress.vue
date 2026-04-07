<script setup lang="ts">
const props = defineProps<{
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
}>();
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
    <h3 v-if="props.stepTitle" class="fh-step-progress__title">{{ props.stepTitle }}</h3>
    <p v-if="props.stepDescription" class="fh-step-progress__description">{{ props.stepDescription }}</p>
  </div>
</template>
