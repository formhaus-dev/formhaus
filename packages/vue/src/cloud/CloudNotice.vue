<script setup lang="ts">
import type { CloudAction, CloudLabelSource, CloudNotice } from '@formhaus/core/cloud';
import { cloudLabel } from '@formhaus/core/internal';

defineProps<{ notice: CloudNotice; labels?: CloudLabelSource }>();
const emit = defineEmits<{ action: [action: NonNullable<CloudAction>] }>();
</script>

<template>
  <div tabindex="-1" :class="['fh-form__notice', `fh-form__notice--${notice.tone}`]">
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
      {{ cloudLabel(labels, notice.action) }}
    </button>
  </div>
</template>
