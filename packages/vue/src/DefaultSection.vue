<script setup lang="ts">
import { matrixColumns } from '@formhaus/core/internal';
import { computed } from 'vue';
import { sectionComponentProps } from './props';

const props = defineProps(sectionComponentProps);
defineSlots<{ default(): unknown }>();
const columns = computed(() => matrixColumns(props.section));
</script>

<template>
  <fieldset
    :id="id"
    :class="['fh-section', columns && 'fh-section--matrix']"
    :aria-describedby="descriptionId"
    :style="columns && { '--fhi-matrix-columns': columns.length }"
  >
    <legend class="fh-section__title">{{ title }}</legend>
    <p v-if="description" :id="descriptionId" class="fh-field__helper fh-section__description">{{ description }}</p>
    <div class="fh-section__body">
      <div v-if="columns" class="fh-section__matrix-header" aria-hidden="true">
        <span v-for="option in columns" :key="option.value">{{ option.label }}</span>
      </div>
      <slot />
    </div>
  </fieldset>
</template>
