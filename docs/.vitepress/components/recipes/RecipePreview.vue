<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import '../templates/detail.css';

const TemplatePreview = defineAsyncComponent(() => import('../templates/TemplatePreview.vue'));
const definitions = import.meta.glob<FormDefinition>('../../../recipes/definitions/*.json', { eager: true, import: 'default' });
const props = defineProps<{ name: string }>();
const definition = definitions[`../../../recipes/definitions/${props.name}.json`];
</script>

<template>
  <section v-if="definition" class="tpl-preview recipe-preview vp-raw" aria-label="Live form preview">
    <ClientOnly>
      <TemplatePreview :definition="definition" />
    </ClientOnly>
  </section>
</template>

<style scoped>
.recipe-preview {
  --tpl-radius: var(--fh-site-space-4);

  margin: var(--fh-site-space-6) 0;
}
</style>
