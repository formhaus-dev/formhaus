<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sandpack } from 'sandpack-vue3';
import PlaygroundDefinitionPanel from './PlaygroundDefinitionPanel.vue';
import { fixtures, fixtureNames } from './fixtures';
import * as reactMui from './loaders/react-mui';
import * as reactDefault from './loaders/react-default';
import * as vueVuetify from './loaders/vue-vuetify';
import * as vueDefault from './loaders/vue-default';
import * as vanillaSvelte from './loaders/vanilla-svelte';

const props = defineProps<{ framework: 'react' | 'vue' | 'svelte' }>();

type Variant = 'library' | 'no-library';

const variants: Record<string, { library: string; noLibrary: string } | null> = {
  react: { library: 'MUI', noLibrary: 'No library' },
  vue: { library: 'Vuetify', noLibrary: 'No library' },
  svelte: null,
};

const loaderMap = {
  react: { library: reactMui, 'no-library': reactDefault },
  vue: { library: vueVuetify, 'no-library': vueDefault },
  svelte: { library: vanillaSvelte, 'no-library': vanillaSvelte },
} as const;

const variant = ref<Variant>('library');
const selected = ref(fixtureNames[0]);

const loader = computed(() => loaderMap[props.framework][variant.value]);

const definitionJson = computed(() =>
  JSON.stringify(fixtures[selected.value], null, 2),
);

const files = computed(() => loader.value.buildFiles(definitionJson.value));

const customSetup = computed(() => {
  const setup: Record<string, unknown> = { dependencies: loader.value.deps };
  if (loader.value.entry) setup.entry = loader.value.entry;
  return setup;
});

const variantConfig = computed(() => variants[props.framework]);
</script>

<template>
  <div>
    <div v-if="variantConfig" class="fh-variant-toggle">
      <button
        :class="['fh-variant-btn', { active: variant === 'library' }]"
        @click="variant = 'library'"
      >{{ variantConfig.library }}</button>
      <button
        :class="['fh-variant-btn', { active: variant === 'no-library' }]"
        @click="variant = 'no-library'"
      >{{ variantConfig.noLibrary }}</button>
    </div>
    <div class="fh-playground-tabs">
      <button
        v-for="name in fixtureNames"
        :key="name"
        :class="['fh-playground-tab', { active: selected === name }]"
        @click="selected = name"
      >{{ name }}</button>
    </div>
    <Sandpack
      :key="framework + '-' + variant + '-' + selected"
      :template="loader.template"
      :files="files"
      :options="{
        showConsole: true,
        editorHeight: loader.editorHeight,
        activeFile: loader.activeFile,
        visibleFiles: loader.visibleFiles,
      }"
      :custom-setup="customSetup"
    />
    <PlaygroundDefinitionPanel :definition="fixtures[selected]" />
  </div>
</template>

<style scoped>
.fh-variant-toggle {
  display: flex;
  gap: 0;
  margin-bottom: 10px;
}
.fh-variant-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.fh-variant-btn:first-child {
  border-radius: 6px 0 0 6px;
}
.fh-variant-btn:last-child {
  border-radius: 0 6px 6px 0;
  border-left: none;
}
.fh-variant-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.fh-variant-btn.active + .fh-variant-btn {
  border-left: none;
}
.fh-playground-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.fh-playground-tab {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.fh-playground-tab.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
</style>
