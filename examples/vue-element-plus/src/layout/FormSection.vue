<script setup lang="ts">
import type { FieldOption } from '@formhaus/core';
import { sectionComponentProps } from '@formhaus/vue';
import { ElCard, ElText } from 'element-plus';
import { computed } from 'vue';

const props = defineProps(sectionComponentProps);
const columns = computed(() =>
  props.section.layout === 'matrix' ? ((props.section.fields[0] as { options?: FieldOption[] } | undefined)?.options ?? []) : undefined,
);
</script>

<template>
  <ElCard
    :id="id"
    shadow="never"
    role="group"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="descriptionId"
    :class="['section', { matrix: columns }]"
    :style="columns && { '--matrix-columns': columns.length }"
  >
    <template #header>
      <h3 :id="`${id}-title`" class="section__title">{{ title }}</h3>
      <ElText v-if="description" :id="descriptionId" tag="p" type="info" class="section__description">{{ description }}</ElText>
    </template>
    <div v-if="columns" class="matrix__row matrix__header" aria-hidden="true">
      <span />
      <ElText v-for="option in columns" :key="option.value" size="small" type="info" class="matrix__cell">{{ option.label }}</ElText>
    </div>
    <div class="fields">
      <slot />
    </div>
  </ElCard>
</template>
