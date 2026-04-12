export function buildFiles(definitionJson: string) {
  return {
    'src/App.vue': `<` + `script setup>
import { FormRenderer } from "@formhaus/vue";

const definition = ${definitionJson};

function onSubmit(values) {
  console.log("Submitted:", values);
}
</` + `script>

<template>
  <div style="max-width: 480px; margin: 24px auto; font-family: sans-serif">
    <FormRenderer :definition="definition" @submit="onSubmit" />
  </div>
</template>`,
  };
}

export const template = 'vue3-ts' as const;
export const entry: string | undefined = undefined;
export const activeFile = 'src/App.vue';
export const visibleFiles = ['src/App.vue'];
export const editorHeight = 480;
export const deps: Record<string, string> = {
  '@formhaus/core': '0.3.1',
  '@formhaus/vue': '0.3.1',
};
