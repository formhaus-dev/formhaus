<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import FormActions from './FormActions.vue';
import FormStepProgress from './FormStepProgress.vue';
import HeadlessFormRenderer from './HeadlessFormRenderer.vue';
import { withDefaultFields } from './constants';
import { useListening } from './composables/useListening';
import type { FormEvent } from '@formhaus/core';
import type { FormRendererEmits, FormRendererHandle, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false, confirmRemove: true, errorSummary: true });

const emit = defineEmits<FormRendererEmits>();

const listening = useListening();
const components = computed(() => withDefaultFields(props.components));
let inner: FormRendererHandle | null = null;
const values = shallowRef<Readonly<Record<string, unknown>>>({});
const bind = (instance: unknown) => {
  inner = instance as FormRendererHandle | null;
};
defineExpose({
  setValue: (key: string, value: unknown) => inner?.setValue(key, value),
  getValues: () => inner?.getValues() ?? {},
  goToStep: (stepId: string) => inner!.goToStep(stepId),
  values,
});
</script>

<template>
  <HeadlessFormRenderer
    :ref="bind"
    v-bind="props"
    :components="components"
    :actions-component="props.actionsComponent ?? FormActions"
    :progress-component="props.progressComponent ?? FormStepProgress"
    @cancel="emit('cancel')"
    @field-change="(key, value, allValues) => emit('fieldChange', key, value, allValues)"
    @values-change="(next) => emit('valuesChange', (values = next))"
    :onFormEvent="listening('onFormEvent') ? (event: FormEvent) => emit('formEvent', event) : undefined"
  />
</template>
