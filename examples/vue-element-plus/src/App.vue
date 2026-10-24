<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { HeadlessFormRenderer } from '@formhaus/vue';
import { ElCard } from 'element-plus';
import type { PropType } from 'vue';
import { components } from './component-map';
import json from './definition.json';
import { layout } from './layout';

defineProps({ definition: { type: Object as PropType<FormDefinition>, default: () => json } });

function onSubmit(values: Record<string, unknown>) {
  console.log('Submitted:', values);
}
</script>

<template>
  <main class="page">
    <ElCard shadow="never">
      <template v-if="definition.title" #header>
        <h1 class="page__title">{{ definition.title }}</h1>
      </template>
      <HeadlessFormRenderer :definition="definition" :components="components" :layout="layout" @submit="onSubmit" />
    </ElCard>
  </main>
</template>
