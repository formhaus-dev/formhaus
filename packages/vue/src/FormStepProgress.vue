<script setup lang="ts">
import { useLabel } from './composables/useLabel';
import { formStepProgressProps } from './props';

const props = defineProps(formStepProgressProps);
const text = useLabel();
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
      <span class="fh-step-progress__counter">{{ props.counterLabel ?? text('stepOf', { current: props.current, total: props.total }) }}</span>
    </div>
    <ol v-if="props.steps" class="fh-step-progress__steps">
      <li v-for="(step, index) in props.steps" :key="step.id" :class="['fh-step-progress__step', { 'fh-step-progress__step--invalid': step.errorCount }]"
        :aria-current="index + 1 === props.current ? 'step' : undefined">
        <strong v-if="index + 1 === props.current">{{ step.title || text('stepTitle', { index: index + 1 }) }}</strong><template v-else>{{ step.title || text('stepTitle', { index: index + 1 }) }}</template>{{ step.errorCount > 0 ? ` · ${text('stepErrors', { count: step.errorCount })}` : '' }}
      </li>
    </ol>
    <component :is="`h${props.headingLevel}`" v-if="props.stepTitle" class="fh-step-progress__title">{{ props.stepTitle }}</component>
    <p v-if="props.stepDescription" class="fh-step-progress__description">{{ props.stepDescription }}</p>
  </div>
</template>
