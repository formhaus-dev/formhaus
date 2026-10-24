<script setup lang="ts">
import { formStepProgressProps } from '@formhaus/vue';
import Badge from 'primevue/badge';
import ProgressBar from 'primevue/progressbar';
import Step from 'primevue/step';
import StepList from 'primevue/steplist';
import Stepper from 'primevue/stepper';

defineProps(formStepProgressProps);
</script>

<template>
  <div v-bind="rootProps" class="progress">
    <Stepper v-if="steps" :value="current" linear>
      <StepList>
        <Step v-for="(step, index) in steps" :key="step.id" :value="index + 1">
          {{ step.title ?? `Step ${index + 1}` }}
          <Badge v-if="marks && step.errorCount" :value="step.errorCount" severity="danger" size="small" />
        </Step>
      </StepList>
    </Stepper>
    <ProgressBar v-else :value="(current / total) * 100" :show-value="false" class="progress__bar" />
    <span v-if="!steps" class="progress__counter">{{ counterLabel ?? `Step ${current} of ${total}` }}</span>
    <component :is="`h${headingLevel}`" v-if="stepTitle" class="progress__title">{{ stepTitle }}</component>
    <p v-if="stepDescription" class="progress__description">{{ stepDescription }}</p>
  </div>
</template>
