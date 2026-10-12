<script setup>
import { computed } from 'vue';

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
  stepTitle: { type: String, default: undefined },
  stepDescription: { type: String, default: undefined },
  headingLevel: { type: Number, default: 2 },
});

const percent = computed(() => (props.current / props.total) * 100);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px">
    <v-progress-linear :model-value="percent" color="primary" rounded />
    <span class="text-caption text-medium-emphasis">
      Step {{ current }} of {{ total }}
    </span>
    <component :is="`h${headingLevel}`" v-if="stepTitle" class="text-h6" style="margin: 0">{{ stepTitle }}</component>
    <p v-if="stepDescription" class="text-body-2 text-medium-emphasis" style="margin: 0">
      {{ stepDescription }}
    </p>
  </div>
</template>
