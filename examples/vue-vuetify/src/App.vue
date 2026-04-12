<script setup>
import { FormRenderer } from '@formhaus/vue';
import { components } from './component-map';
import FormActions from './actions/FormActions.vue';
import StepProgress from './actions/StepProgress.vue';
import definition from './definition.json';

function onSubmit(values) {
  console.log('Submitted:', values);
}
</script>

<template>
  <v-app>
    <v-container style="max-width: 600px">
      <FormRenderer
        :definition="definition"
        :components="components"
        :actions-component="FormActions"
        :progress-component="StepProgress"
        @submit="onSubmit"
      />
    </v-container>
  </v-app>
</template>
