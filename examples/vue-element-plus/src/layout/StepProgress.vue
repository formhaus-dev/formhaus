<script setup lang="ts">
import { formStepProgressProps } from '@formhaus/vue';
import { ElProgress, ElStep, ElSteps, ElText } from 'element-plus';

defineProps(formStepProgressProps);
</script>

<template>
  <div v-bind="rootProps" class="progress">
    <ElSteps v-if="steps" :active="current - 1" finish-status="success" process-status="process" align-center>
      <ElStep
        v-for="(step, index) in steps"
        :key="step.id"
        :title="step.title ?? `Step ${index + 1}`"
        :description="marks && step.errorCount ? `${step.errorCount} to fix` : undefined"
        :status="marks && step.errorCount ? 'error' : undefined"
        :aria-current="index + 1 === current ? 'step' : undefined"
      />
    </ElSteps>
    <ElProgress v-else :percentage="(current / total) * 100" :show-text="false" />
    <ElText v-if="!steps" type="info" class="progress__counter">{{ counterLabel ?? `Step ${current} of ${total}` }}</ElText>
    <component :is="`h${headingLevel}`" v-if="stepTitle" class="progress__title">{{ stepTitle }}</component>
    <ElText v-if="stepDescription" tag="p" type="info" class="progress__description">{{ stepDescription }}</ElText>
  </div>
</template>
