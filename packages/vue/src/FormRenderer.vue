<script setup lang="ts">
import { computed } from 'vue';
import FormActions from './FormActions.vue';
import FormStepProgress from './FormStepProgress.vue';
import HeadlessFormRenderer from './HeadlessFormRenderer.vue';
import { withDefaultFields } from './constants';
import type { FormRendererEmits, FormRendererHandle, FormRendererProps } from './types';

const props = withDefaults(defineProps<FormRendererProps>(), { loading: false, confirmRemove: true });

const emit = defineEmits<FormRendererEmits>();

const components = computed(() => withDefaultFields(props.components));
let inner: FormRendererHandle | null = null;
const handle: FormRendererHandle = {
  setValue: (key, value) => inner?.setValue(key, value),
  getValues: () => inner?.getValues() ?? {},
};
const bind = (instance: unknown) => {
  inner = instance as FormRendererHandle | null;
};
defineExpose(handle);
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
    @analytics-event="(event) => emit('analyticsEvent', event)"
  />
</template>
