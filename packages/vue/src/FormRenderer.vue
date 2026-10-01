<script setup lang="ts">
import { computed } from 'vue';
import FormActions from './FormActions.vue';
import FormStepProgress from './FormStepProgress.vue';
import HeadlessFormRenderer from './HeadlessFormRenderer.vue';
import { withDefaultFields } from './constants';
import type { FormRendererEmits, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false });

const emit = defineEmits<FormRendererEmits>();

const components = computed(() => withDefaultFields(props.components));
</script>

<template>
  <HeadlessFormRenderer
    v-bind="props"
    :components="components"
    :actions-component="props.actionsComponent ?? FormActions"
    :progress-component="props.progressComponent ?? FormStepProgress"
    @submit="(values) => emit('submit', values)"
    @cancel="emit('cancel')"
    @step-change="(stepId, direction) => emit('stepChange', stepId, direction)"
    @field-change="(key, value, allValues) => emit('fieldChange', key, value, allValues)"
    @analytics-event="(event) => emit('analyticsEvent', event)"
  />
</template>
