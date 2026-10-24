<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { HeadlessFormRenderer } from '@formhaus/vue';
import Card from 'primevue/card';
import { ref, type PropType } from 'vue';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';
import FormCompletion from './layout/FormCompletion.vue';

defineProps({ definition: { type: Object as PropType<FormDefinition>, default: () => json } });

const submitted = ref<Record<string, unknown> | null>(null);

function onSubmit(values: Record<string, unknown>) {
  submitted.value = values;
}
</script>

<template>
  <main class="page">
    <Card>
      <template #title>
        <h1 class="page__title">{{ definition.title }}</h1>
      </template>
      <template #content>
        <FormCompletion v-if="submitted" :definition="definition" :values="submitted" @restart="submitted = null" />
        <HeadlessFormRenderer v-else :definition="definition" :components="components" :layout="layout" conditional-reveal @submit="onSubmit" />
      </template>
    </Card>
  </main>
</template>
