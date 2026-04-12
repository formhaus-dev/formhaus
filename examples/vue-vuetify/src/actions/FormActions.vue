<script setup>
defineProps({
  primaryLabel: { type: String, default: undefined },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: undefined },
  cancelAction: { type: Object, default: undefined },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['primary', 'prev', 'cancel']);
</script>

<template>
  <div style="display: flex; justify-content: space-between; gap: 8px; padding-top: 16px">
    <div style="display: flex; gap: 8px">
      <v-btn v-if="showBack" variant="outlined" :disabled="loading" @click="emit('prev')">
        {{ backLabel }}
      </v-btn>
      <v-btn v-if="cancelAction" variant="text" :disabled="loading" @click="emit('cancel')">
        {{ cancelAction.label }}
      </v-btn>
    </div>
    <v-btn color="primary" :loading="loading" @click="emit('primary')">
      {{ primaryLabel }}
    </v-btn>
  </div>
</template>
