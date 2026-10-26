<script setup lang="ts">
import { defineAsyncComponent, onMounted, shallowRef } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import '../templates/detail.css';

const TemplatePreview = defineAsyncComponent(() => import('../templates/TemplatePreview.vue'));
const loaders = import.meta.glob<FormDefinition>('../../../recipes/definitions/*.json', { import: 'default' });
const props = defineProps<{ name: string }>();
const load = loaders[`../../../recipes/definitions/${props.name}.json`];
if (!load) throw new Error(`RecipePreview: no definition named "${props.name}" in docs/recipes/definitions`);
const definition = shallowRef<FormDefinition>();

onMounted(async () => {
  definition.value = await load();
});
</script>

<template>
  <section class="tpl-preview recipe-preview vp-raw" aria-label="Live form preview">
    <TemplatePreview v-if="definition" :definition="definition" />
  </section>
</template>

<style scoped>
.recipe-preview {
  --tpl-radius: var(--fh-site-space-4);

  margin: var(--fh-site-space-6) 0;
  min-height: calc(var(--fh-site-space-24) * 2);
}
</style>
