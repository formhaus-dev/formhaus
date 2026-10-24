<script setup>
defineProps({
  id: { type: String, required: true },
  section: { type: Object, required: true },
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  descriptionId: { type: String, default: undefined },
  columns: { type: Array, default: undefined },
});
</script>

<template>
  <fieldset :id="id" :aria-describedby="descriptionId" class="form-section">
    <legend class="text-subtitle-1 font-weight-medium mb-1">{{ title }}</legend>
    <p v-if="description" :id="descriptionId" class="text-body-2 text-medium-emphasis mb-2">{{ description }}</p>
    <v-sheet v-if="columns" border rounded class="matrix">
      <div class="matrix-row matrix-row--head text-caption text-medium-emphasis" aria-hidden="true">
        <span class="matrix-row__label" />
        <div class="matrix-row__group">
          <span v-for="column in columns" :key="column.value" class="matrix-row__cell">{{ column.label }}</span>
        </div>
      </div>
      <slot />
    </v-sheet>
    <slot v-else />
  </fieldset>
</template>

<style>
.form-section {
  min-width: 0;
  margin: 8px 0 16px;
  padding: 0;
  border: 0;
}

.matrix {
  overflow-x: auto;
}

.matrix-row {
  display: flex;
  align-items: center;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.matrix-row:last-child {
  border-bottom: 0;
}

.matrix-row__label {
  flex: 1 1 auto;
  min-width: 9rem;
  padding: 10px 12px;
}

.matrix-row__group {
  display: flex;
  flex: none;
}

.matrix-row__group .v-selection-control-group {
  flex-wrap: nowrap;
}

.matrix-row__cell {
  display: flex;
  flex: none !important;
  justify-content: center;
  width: 5.5rem;
  margin: 0 !important;
  text-align: center;
}

.matrix-row--head {
  padding-block: 6px;
}
</style>
