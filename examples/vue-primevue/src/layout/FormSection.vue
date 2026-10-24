<script setup lang="ts">
import { sectionComponentProps } from '@formhaus/vue';
import Fieldset from 'primevue/fieldset';

defineProps(sectionComponentProps);
</script>

<template>
  <Fieldset
    :id="id"
    :legend="title"
    :aria-describedby="descriptionId"
    :class="['section', { matrix: columns }]"
    :style="columns && { '--matrix-columns': columns.length }"
  >
    <p v-if="description" :id="descriptionId" class="section__description">{{ description }}</p>
    <div v-if="columns" class="matrix__row matrix__header" aria-hidden="true">
      <span />
      <span v-for="option in columns" :key="option.value" class="matrix__cell">{{ option.label }}</span>
    </div>
    <div class="fields">
      <slot />
    </div>
  </Fieldset>
</template>
