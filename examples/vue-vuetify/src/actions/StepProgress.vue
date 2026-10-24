<script setup>
import { computed } from 'vue';

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
  steps: { type: Array, default: undefined },
  marks: { type: Boolean, default: false },
  counterLabel: { type: String, default: undefined },
  stepTitle: { type: String, default: undefined },
  stepDescription: { type: String, default: undefined },
  headingLevel: { type: Number, default: 2 },
});

const stepper = computed(() => !!props.steps && props.steps.length <= 4);
</script>

<template>
  <div class="d-flex flex-column ga-2 mb-4">
    <v-stepper v-if="stepper" :model-value="current" flat alt-labels class="bg-transparent">
      <v-stepper-header class="elevation-0">
        <template v-for="(step, index) in steps" :key="step.id">
          <v-divider v-if="index" />
          <v-stepper-item
            :value="index + 1"
            :title="step.title || `Step ${index + 1}`"
            :complete="index + 1 < current"
            :error="marks && step.errorCount > 0"
          />
        </template>
      </v-stepper-header>
    </v-stepper>
    <template v-else>
      <v-progress-linear :model-value="(current / total) * 100" color="primary" rounded :aria-label="counterLabel" />
      <span class="text-caption text-medium-emphasis">{{ counterLabel }}</span>
    </template>
    <component :is="`h${headingLevel}`" v-if="stepTitle" class="text-h6 ma-0">{{ stepTitle }}</component>
    <p v-if="stepDescription" class="text-body-2 text-medium-emphasis ma-0">{{ stepDescription }}</p>
  </div>
</template>
