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
      <span class="fh-step-progress__counter">{{ props.counterLabel ?? `Step ${props.current} of ${props.total}` }}</span>
    </div>
    <ol v-if="props.steps" class="fh-step-progress__steps">
      <li v-for="(step, index) in props.steps" :key="step.id" :class="['fh-step-progress__step', { 'fh-step-progress__step--invalid': step.errorCount }]"
        :aria-current="index + 1 === props.current ? 'step' : undefined">
        <strong v-if="index + 1 === props.current">{{ step.title || `Step ${index + 1}` }}</strong><template v-else>{{ step.title || `Step ${index + 1}` }}</template>{{ step.errorCount > 0 ? ` · ${step.errorCount} ${step.errorCount === 1 ? 'error' : 'errors'}` : '' }}
      </li>
    </ol>
    <component :is="`h${props.headingLevel}`" v-if="props.stepTitle" class="fh-step-progress__title">{{ props.stepTitle }}</component>
    <p v-if="props.stepDescription" class="fh-step-progress__description">{{ props.stepDescription }}</p>
  </div>
</template>
