<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useData } from 'vitepress';
import { FormRenderer } from '@formhaus/vue';
import type { FormDefinition, ValidateFn } from '@formhaus/core';
import styles from '@formhaus/core/style.css?inline';
import LucideIcon from '../landing/LucideIcon.vue';
import './detail.css';

const props = defineProps<{ definition: FormDefinition; onValidate?: ValidateFn }>();
const { isDark } = useData();
const run = ref(0);
const payload = ref<Record<string, unknown>>();
const result = ref<HTMLElement>();

onMounted(() => {
  if (document.getElementById('fh-template-styles')) return;
  const style = document.createElement('style');
  style.id = 'fh-template-styles';
  style.textContent = `@scope (.tpl-preview__form) {${styles}}`;
  document.head.append(style);
});

async function onSubmit(values: Record<string, unknown>) {
  payload.value = values;
  await nextTick();
  result.value?.focus();
}

function restart() {
  payload.value = undefined;
  run.value += 1;
}
</script>

<template>
  <div class="tpl-preview__form" :data-fh-theme="isDark ? 'dark' : 'light'">
    <div v-if="payload" ref="result" class="tpl-preview__result" tabindex="-1">
      <p class="tpl-preview__done"><span class="tpl-preview__badge"><LucideIcon name="check" /></span>Submitted</p>
      <p class="tpl-preview__note">Nothing was sent. This is the payload your submit handler would receive.</p>
      <pre class="tpl-preview__payload"><code>{{ JSON.stringify(payload, null, 2) }}</code></pre>
      <button type="button" class="tpl-button tpl-button--secondary" @click="restart">
        <LucideIcon name="restart" /> Start over
      </button>
    </div>
    <FormRenderer v-else :key="run" :definition="props.definition" :on-validate="props.onValidate" @submit="onSubmit" />
  </div>
</template>
