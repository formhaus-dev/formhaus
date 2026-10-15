<script setup lang="ts">
import type { GroupItemComponentProps } from './types';

defineProps<GroupItemComponentProps>();
</script>

<template>
  <div class="fh-group__item" role="group" :aria-labelledby="titleId">
    <div class="fh-group__header">
      <span :id="titleId" tabindex="-1" class="fh-group__title">{{ title }}</span>
      <button v-if="canRemove" type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__remove"
        :aria-label="`${removeLabel} ${title}`" :disabled="disabled" @click="remove">{{ removeLabel }}</button>
    </div>
    <div class="fh-group__fields"><component :is="fields" /></div>
  </div>
</template>
