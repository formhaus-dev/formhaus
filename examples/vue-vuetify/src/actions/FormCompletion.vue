<script setup>
import { computed } from 'vue';
import { answers, completion } from '../answers';

const props = defineProps({
  definition: { type: Object, required: true },
  values: { type: Object, required: true },
});
const emit = defineEmits(['restart']);
const rows = computed(() => answers(props.definition, props.values));
</script>

<template>
  <div class="d-flex flex-column ga-6 align-start">
    <v-alert type="success" variant="tonal" role="status" class="w-100">
      <template #title>
        <h2 class="text-h6">{{ completion.title }}</h2>
      </template>
      {{ completion.body }}
    </v-alert>
    <h3 class="text-h6">{{ completion.answers }}</h3>
    <v-card variant="flat" border class="w-100">
      <v-list lines="two" density="comfortable" :aria-label="completion.answers">
        <template v-for="(row, index) in rows" :key="row.key">
          <v-divider v-if="index" />
          <v-list-item>
            <v-list-item-subtitle class="mb-1">{{ row.label }}</v-list-item-subtitle>
            <div class="text-body-1 text-pre-wrap text-break">{{ row.value }}</div>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
    <v-btn color="primary" variant="tonal" @click="emit('restart')">{{ completion.again }}</v-btn>
  </div>
</template>
