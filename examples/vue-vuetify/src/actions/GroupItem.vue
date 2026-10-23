<script setup>
defineProps({
  id: { type: String, required: true },
  index: { type: Number, required: true },
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  canRemove: { type: Boolean, default: false },
  remove: { type: Function, required: true },
  requestRemove: { type: Function, required: true },
  hasContent: { type: Boolean, default: false },
  removeLabel: { type: String, required: true },
  removeName: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});
</script>

<template>
  <v-card variant="outlined" role="group" :aria-labelledby="titleId">
    <div class="d-flex align-center justify-space-between px-4 pt-3">
      <span :id="titleId" tabindex="-1" class="text-subtitle-1 font-weight-medium">{{ title }}</span>
      <v-btn
        v-if="canRemove"
        :id="`${titleId}-remove`"
        variant="text"
        color="error"
        size="small"
        :disabled="disabled"
        :aria-label="removeName"
        @click="requestRemove"
      >
        {{ removeLabel }}
      </v-btn>
    </div>
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>
