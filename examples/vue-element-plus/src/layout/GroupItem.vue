<script setup lang="ts">
import { groupItemComponentProps } from '@formhaus/vue';
import { ElButton, ElDivider } from 'element-plus';

defineProps(groupItemComponentProps);
</script>

<template>
  <div role="group" :aria-labelledby="titleId" data-fh-group-item class="group__item">
    <ElDivider v-if="index > 0" />
    <div class="group__header">
      <h4 :id="titleId" tabindex="-1" class="group__title">{{ title }}</h4>
      <ElButton
        v-if="canRemove"
        :id="`${titleId}-remove`"
        type="danger"
        link
        :aria-label="removeName"
        :disabled="disabled"
        @click="requestRemove"
      >
        {{ removeLabel }}
      </ElButton>
    </div>
    <div class="fields">
      <component :is="fields" />
    </div>
  </div>
</template>
