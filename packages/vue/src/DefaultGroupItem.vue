<script setup lang="ts">
import type { GroupItemComponentProps } from './types';

defineProps<GroupItemComponentProps>();
</script>

<template>
  <div class="fh-group__item" role="group" :aria-labelledby="titleId">
    <div class="fh-group__header">
      <span :id="titleId" tabindex="-1" class="fh-group__title">{{ title }}</span>
      <button v-if="canRemove && !confirming" :id="`${titleId}-remove`" type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__remove"
        :aria-label="`${removeLabel} ${title}`" :disabled="disabled" @click="requestRemove">{{ removeLabel }}</button>
      <div v-if="confirming" class="fh-group__confirm" role="group" :aria-labelledby="`${titleId}-prompt`" @keydown.esc.prevent="cancelRemove">
        <span :id="`${titleId}-prompt`" class="fh-group__prompt">{{ prompt }}</span>
        <span class="fh-group__confirm-actions">
          <button :id="`${titleId}-confirm`" type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__remove" :disabled="disabled" @click="remove">{{ removeLabel }}</button>
          <button type="button" class="fh-form-actions__button fh-form-actions__button--text fh-group__keep" @click="cancelRemove">{{ keepLabel }}</button>
        </span>
      </div>
    </div>
    <div class="fh-group__fields"><component :is="fields" /></div>
  </div>
</template>
