<script setup>
defineProps({
  id: { type: String, required: true },
  group: { type: Object, required: true },
  label: { type: String, required: true },
  helperText: { type: String, default: undefined },
  error: { type: String, default: undefined },
  describedBy: { type: String, default: undefined },
  items: { type: Array, required: true },
  canAdd: { type: Boolean, default: false },
  add: { type: Function, required: true },
  remove: { type: Function, required: true },
  requestRemove: { type: Function, required: true },
  addLabel: { type: String, required: true },
  removeLabel: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  status: { type: String, default: '' },
  itemComponent: { type: [Object, Function], required: true },
});
</script>

<template>
  <fieldset :id="id" :aria-describedby="describedBy" :aria-invalid="error ? true : undefined" class="form-section">
    <legend class="text-subtitle-1 font-weight-medium mb-1">{{ label }}</legend>
    <p v-if="helperText" :id="`${id}-helper`" class="text-body-2 text-medium-emphasis mb-3">{{ helperText }}</p>
    <p v-if="error" :id="`${id}-error`" class="text-body-2 text-error mb-3">{{ error }}</p>
    <div class="d-flex flex-column ga-4">
      <component :is="itemComponent" v-for="item in items" :key="item.id" v-bind="item" />
    </div>
    <v-btn v-if="canAdd" variant="outlined" class="mt-4" :disabled="disabled" @click="add">{{ addLabel }}</v-btn>
    <p class="d-sr-only" role="status">{{ status }}</p>
  </fieldset>
</template>
