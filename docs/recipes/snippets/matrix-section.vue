<script setup lang="ts">
import { sectionComponentProps } from '@formhaus/vue';

const props = defineProps(sectionComponentProps);
</script>

<template>
  <fieldset :id="props.id" :aria-describedby="props.descriptionId" :class="{ matrix: props.columns }">
    <legend>{{ props.title }}</legend>
    <p v-if="props.description" :id="props.descriptionId">{{ props.description }}</p>
    <div v-if="props.columns" class="matrix__header" aria-hidden="true">
      <span v-for="column in props.columns" :key="column.value">{{ column.label }}</span>
    </div>
    <slot />
  </fieldset>
</template>
