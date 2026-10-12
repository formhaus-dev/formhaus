<script setup lang="ts">
import LandingSection from '../landing/LandingSection.vue';
import CopyLine from '../landing/CopyLine.vue';
const embed = '<script src="https://f.formhaus.dev/embed.js" data-form="waitlist" async><' + '/script>';
</script>

<template>
  <LandingSection id="embed" title="Works where you build" lead="Share a link, paste one line, or use a React/Vue component.">
    <div class="embed-lines">
      <CopyLine command="https://f.formhaus.dev/waitlist" label="Copy form link" />
      <CopyLine :command="embed" label="Copy embed code" />
    </div>
  </LandingSection>
</template>

<style scoped>
.embed-lines { display: grid; gap: 16px; }
</style>
