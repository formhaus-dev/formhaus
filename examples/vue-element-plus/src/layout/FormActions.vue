<script setup lang="ts">
import { formActionsEmits, formActionsProps } from '@formhaus/vue';
import { ElButton } from 'element-plus';

defineProps(formActionsProps);
const emit = defineEmits(formActionsEmits);
</script>

<template>
  <div v-bind="rootProps" class="actions">
    <div class="actions__secondary">
      <ElButton v-if="showBack" :disabled="loading" :data-testid="testIds?.back" @click="emit('back')">{{ backLabel }}</ElButton>
      <ElButton v-if="showSkip" text :disabled="loading" @click="emit('skip')">{{ skipLabel }}</ElButton>
      <ElButton v-if="cancelAction" text :disabled="loading" @click="emit('cancel')">{{ cancelAction.label }}</ElButton>
    </div>
    <ElButton
      v-if="showPrimary !== false"
      type="primary"
      native-type="submit"
      :loading="loading"
      :data-testid="testIds?.[isMultiStep && !isLastStep ? 'next' : 'submit']"
      @click.prevent="emit('primary')"
    >
      {{ primaryLabel }}
    </ElButton>
  </div>
</template>
