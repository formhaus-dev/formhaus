<script setup lang="ts">
const repo = 'https://github.com/ignsm/formhaus';
</script>

<template>
  <p class="open-source">
    Formhaus is open source (MIT).
    <a :href="repo" target="_blank" rel="noopener">Star it on GitHub</a>
    if it saves you time.
  </p>
</template>

<style scoped>
.vp-doc .open-source {
  max-width: 1152px;
  margin: 56px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.vp-doc .open-source a {
  color: var(--vp-c-text-1);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.vp-doc .open-source a:hover {
  color: var(--vp-c-brand-1);
}
</style>
