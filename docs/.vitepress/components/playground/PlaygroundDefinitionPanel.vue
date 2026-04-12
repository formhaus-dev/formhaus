<script setup lang="ts">
defineProps<{ definition: object }>();
</script>

<template>
  <details class="fh-definition-panel">
    <summary>Form definition</summary>
    <pre><code>{{ JSON.stringify(definition, null, 2) }}</code></pre>
  </details>
</template>

<style scoped>
.fh-definition-panel {
  margin-top: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
}
.fh-definition-panel summary {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
  background: var(--vp-c-bg-soft);
}
.fh-definition-panel pre {
  margin: 0;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  background: var(--vp-c-bg);
}
</style>
