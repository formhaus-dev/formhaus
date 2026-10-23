<script setup>
import { FormRenderer } from '@formhaus/vue';
import { components } from './component-map';
import FormActions from './actions/FormActions.vue';
import StepProgress from './actions/StepProgress.vue';
import json from './definition.json';

defineProps({ definition: { type: Object, default: () => json } });

const layout = { actions: FormActions, progress: StepProgress };

function onSubmit(values) {
  console.log('Submitted:', values);
}
</script>

<template>
  <v-app>
    <v-container style="max-width: 600px">
      <FormRenderer :definition="definition" :components="components" :layout="layout" @submit="onSubmit" />
    </v-container>
  </v-app>
</template>
