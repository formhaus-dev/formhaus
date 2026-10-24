<script setup lang="ts">
import { formActionsEmits, formActionsProps } from '@formhaus/vue';
import Button from 'primevue/button';

defineProps(formActionsProps);
const emit = defineEmits(formActionsEmits);
</script>

<template>
  <div v-bind="rootProps" class="actions">
    <div class="actions__secondary">
      <Button
        v-if="showBack"
        :label="backLabel"
        severity="secondary"
        variant="outlined"
        :disabled="loading"
        :data-testid="testIds?.back"
        @click="emit('back')"
      />
      <Button v-if="showSkip" :label="skipLabel" severity="secondary" variant="text" :disabled="loading" @click="emit('skip')" />
      <Button v-if="cancelAction" :label="cancelAction.label" severity="secondary" variant="text" :disabled="loading" @click="emit('cancel')" />
    </div>
    <Button
      v-if="showPrimary !== false"
      type="submit"
      :label="primaryLabel"
      :loading="loading"
      :data-testid="testIds?.[isMultiStep && !isLastStep ? 'next' : 'submit']"
      @click.prevent="emit('primary')"
    />
  </div>
</template>
