<script setup lang="ts">
import type { FieldProps } from '@formhaus/vue';

defineProps<{ f: FieldProps }>();
</script>

<template>
  <div class="tiles">
    <v-card
      v-for="(option, index) in f.options"
      :key="option.value"
      tag="label"
      :for="f.option(option, index).id"
      variant="outlined"
      :color="f.value === option.value ? 'primary' : undefined"
      class="tile"
    >
      <v-img v-if="option.image" :src="option.image" alt="" aspect-ratio="1.333" cover />
      <span class="d-flex align-center pe-3 text-body-1">
        <v-radio :id="f.option(option, index).id" :value="option.value" class="flex-grow-0" />
        {{ option.label }}
      </span>
    </v-card>
  </div>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  width: 100%;
}

.tile {
  cursor: pointer;
}
</style>
