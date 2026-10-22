<script setup lang="ts">
import { type FormAction, isActionDisabled } from '@formhaus/core';
import { useLabel } from './composables/useLabel';
import { formActionsEmits, formActionsProps } from './props';

const props = defineProps(formActionsProps);

const emit = defineEmits(formActionsEmits);
const text = useLabel();

function isPrimaryDisabled(): boolean {
  return (
    !!props.loading || isActionDisabled(props.isMultiStep && !props.isLastStep ? props.nextAction : props.submitAction, props.values ?? {})
  );
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
  if (props.isMultiStep && !props.isLastStep) return text('continue');
  return props.submitAction?.label ?? text('submit');
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
  return (typeof props.backAction === 'object' ? props.backAction?.label : undefined) ?? text('back');
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
        :data-testid="props.testIds?.back"
        @click="emit('back')"
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
        {{ props.skipLabel ?? props.skipAction?.label ?? text('skip') }}
      </button>
    </div>
    <button
      v-if="props.showPrimary !== false"
      type="submit"
      class="fh-form-actions__button fh-form-actions__button--primary"
      :disabled="isPrimaryDisabled()"
      :aria-busy="props.loading"
      :data-testid="props.testIds?.[props.isMultiStep && !props.isLastStep ? 'next' : 'submit']"
      @click.prevent="onPrimaryClick"
    >
      {{ getPrimaryLabel() }}
    </button>
  </div>
</template>
