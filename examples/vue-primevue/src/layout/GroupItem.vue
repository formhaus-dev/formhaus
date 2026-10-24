<script setup lang="ts">
import { groupItemComponentProps } from '@formhaus/vue';
import Button from 'primevue/button';
import Panel from 'primevue/panel';

defineProps(groupItemComponentProps);
</script>

<template>
  <Panel role="group" :aria-labelledby="titleId" data-fh-group-item>
    <template #header>
      <span :id="titleId" tabindex="-1" class="group__title">{{ title }}</span>
    </template>
    <template #icons>
      <Button
        v-if="canRemove"
        :id="`${titleId}-remove`"
        :label="removeLabel"
        :aria-label="removeName"
        severity="danger"
        variant="text"
        size="small"
        :disabled="disabled"
        @click="requestRemove"
      />
    </template>
    <div class="fields">
      <component :is="fields" />
    </div>
  </Panel>
</template>
