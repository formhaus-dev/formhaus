<script setup lang="ts">
import type { CloudAction, CloudNotice } from '@formhaus/core/cloud';

defineProps<{ notice: CloudNotice | null }>();
const emit = defineEmits<{ action: [action: Exclude<CloudAction, null>] }>();
const LABELS = { retry: 'Try again', reload: 'Reload page' };
</script>

<template>
  <div v-if="notice" tabindex="-1" :class="['fh-form__notice', `fh-form__notice--${notice.tone}`]">
    <p>{{ notice.message }}</p>
    <ul v-if="notice.details.length > 0">
      <li v-for="detail in notice.details" :key="detail">{{ detail }}</li>
    </ul>
    <button
      v-if="notice.action"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--secondary"
      @click="emit('action', notice.action!)"
    >
      {{ LABELS[notice.action] }}
    </button>
  </div>
</template>
