<script setup lang="ts">
import { sectionComponentProps } from '@formhaus/vue';

const props = defineProps(sectionComponentProps);
</script>

<template>
  <section :id="props.id" :data-section="props.section.key">
    <h3>{{ props.title }}</h3>
    <slot />
  </section>
</template>
