<script setup>
import { ref } from 'vue';
import { FormRenderer } from '@formhaus/vue';
import { components } from './component-map';
import FormActions from './actions/FormActions.vue';
import StepProgress from './actions/StepProgress.vue';
import ErrorSummary from './actions/ErrorSummary.vue';
import FormSection from './actions/FormSection.vue';
import FormGroup from './actions/FormGroup.vue';
import GroupItem from './actions/GroupItem.vue';
import ConfirmDialog from './actions/ConfirmDialog.vue';
import FormCompletion from './actions/FormCompletion.vue';
import json from './definition.json';

defineProps({ definition: { type: Object, default: () => json } });

const layout = {
  actions: FormActions,
  progress: StepProgress,
  section: FormSection,
  errorSummary: ErrorSummary,
  group: FormGroup,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};

const submitted = ref(null);

function onSubmit(values) {
  submitted.value = values;
}
</script>

<template>
  <v-app>
    <v-container style="max-width: 600px">
      <FormCompletion v-if="submitted" :definition="definition" :values="submitted" @restart="submitted = null" />
      <FormRenderer v-else :definition="definition" :components="components" :layout="layout" conditional-reveal @submit="onSubmit" />
    </v-container>
  </v-app>
</template>
