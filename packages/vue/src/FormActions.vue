<script setup lang="ts">
import { type FormAction, evaluateCondition } from '@formhaus/core';
import type { FormActionsProps } from './types';

const props = withDefaults(defineProps<FormActionsProps>(), {
  showPrimary: undefined,
  showBack: undefined,
  showSkip: undefined,
});

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'cancel'): void;
  (e: 'skip'): void;
  (e: 'primary'): void;
  (e: 'action', name: string): void;
}>();

function isActionDisabled(action: FormAction | undefined): boolean {
  if (props.loading) return true;
  if (!action?.disabled || action.disabled.length === 0) return false;
  return action.disabled.every((c) => evaluateCondition(c, props.values ?? {}));
}

function getButtonClass(action: FormAction | false | undefined, variant: NonNullable<FormAction['variant']>): string {
  return `fh-form-actions__button--${(action && action.variant) || variant}`;
}

function onPrimaryClick() {
  if (props.primaryLabel !== undefined) {
    emit('primary');
  } else if (props.isMultiStep && !props.isLastStep) {
    emit('next');
  } else {
    emit('submit');
  }
}

function getPrimaryLabel(): string {
  if (props.primaryLabel !== undefined) return props.primaryLabel;
  if (props.isMultiStep && !props.isLastStep) return 'Continue';
  return props.submitAction?.label ?? 'Submit';
}

function getShouldShowBack(): boolean {
  if (props.showBack !== undefined) return props.showBack;
  return props.isMultiStep && !props.isFirstStep && props.backAction !== false;
}

function getShouldShowSkip(): boolean {
  return props.showSkip ?? (props.isMultiStep && !!props.skipAction);
}

function getBackLabel(): string {
  if (props.backLabel !== undefined) return props.backLabel;
  return (typeof props.backAction === 'object' ? props.backAction?.label : undefined) ?? 'Back';
}
</script>

<template>
  <div class="fh-form-actions">
    <div class="fh-form-actions__secondary">
      <button
        v-if="getShouldShowBack()"
        type="button"
        :class="['fh-form-actions__button', getButtonClass(props.backAction, 'secondary')]"
        :disabled="props.loading"
        @click="emit('prev')"
      >
        {{ getBackLabel() }}
      </button>
      <button
        v-if="props.cancelAction"
        type="button"
        :class="['fh-form-actions__button', getButtonClass(props.cancelAction, 'text')]"
        :disabled="props.loading"
        @click="emit('cancel')"
      >
        {{ props.cancelAction.label }}
      </button>
      <button
        v-if="getShouldShowSkip()"
        type="button"
        :class="['fh-form-actions__button', getButtonClass(props.skipAction, 'text')]"
        :disabled="props.loading"
        @click="emit('skip')"
      >
        {{ props.skipLabel ?? props.skipAction?.label ?? 'Skip' }}
      </button>
    </div>
    <button
      v-if="props.showPrimary !== false"
      type="button"
      class="fh-form-actions__button fh-form-actions__button--primary"
      :disabled="isActionDisabled(props.isMultiStep && !props.isLastStep ? undefined : props.submitAction)"
      @click="onPrimaryClick"
    >
      {{ getPrimaryLabel() }}
    </button>
  </div>
</template>
