<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { HeadlessFormRenderer } from '@formhaus/vue';
import { ElCard } from 'element-plus';
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
    <ElCard shadow="never">
      <template v-if="definition.title" #header>
        <h1 class="page__title">{{ definition.title }}</h1>
      </template>
      <FormCompletion v-if="submitted" :definition="definition" :values="submitted" @restart="submitted = null" />
      <HeadlessFormRenderer v-else :definition="definition" :components="components" :layout="layout" @submit="onSubmit" />
    </ElCard>
  </main>
</template>
