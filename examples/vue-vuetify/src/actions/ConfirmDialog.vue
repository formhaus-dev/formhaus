<script setup>
defineProps({
  id: { type: String, required: true },
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
  confirm: { type: Function, required: true },
  cancel: { type: Function, required: true },
});
</script>

<template>
  <v-dialog :model-value="open" max-width="420" @update:model-value="(value) => !value && cancel()">
    <v-card :id="id" :title="title" :text="description">
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancel">{{ cancelLabel }}</v-btn>
        <v-btn color="error" variant="flat" @click="confirm">{{ confirmLabel }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
