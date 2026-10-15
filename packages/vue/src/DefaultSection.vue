<script setup lang="ts">
import type { SectionComponentProps } from './types';

defineProps<SectionComponentProps>();
</script>

<template>
  <fieldset :id="id" class="fh-section" :aria-describedby="descriptionId">
    <legend class="fh-section__title">{{ title }}</legend>
    <p v-if="description" :id="descriptionId" class="fh-field__helper fh-section__description">{{ description }}</p>
    <div class="fh-section__body"><slot /></div>
  </fieldset>
</template>
