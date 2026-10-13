<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import type { StepChangeContext } from '@formhaus/core';
import { FormRenderer } from '@formhaus/vue';
import LucideIcon from './LucideIcon.vue';
import OnboardingChoices from './OnboardingChoices.vue';
import { choices, definition, type StartChoice } from './onboarding';
import './demo-form.css';
import './demo-options.css';
import './demo-actions.css';

const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const heading = ref<HTMLElement>();
const choice = ref<StartChoice>();
const initial = ref<Record<string, unknown>>();
const titleId = useId();
const components = { radio: OnboardingChoices };
const noProgress = () => null;
const title = computed(() => (choice.value ? choices[choice.value].title : definition.title));
const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]';
let pressedBackdrop = false;
let overflow = '';

onMounted(() => {
  overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  dialog.value?.showModal();
  dialog.value?.focus();
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = overflow;
});

async function onBeforeStepChange(context: StepChangeContext) {
  initial.value = { start: context.values.start };
  choice.value = context.values.start as StartChoice;
  await nextTick();
  heading.value?.focus();
  return false;
}

async function back() {
  choice.value = undefined;
  await nextTick();
  dialog.value?.focus();
}

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialog.value) return;
  const items = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.getClientRects().length);
  const edge = event.shiftKey ? items[0] : items[items.length - 1];
  if (document.activeElement !== edge && document.activeElement !== dialog.value) return;
  event.preventDefault();
  (event.shiftKey ? items[items.length - 1] : items[0])?.focus();
}

function onPointerDown(event: PointerEvent) {
  pressedBackdrop = event.target === dialog.value;
}

function onClick(event: MouseEvent) {
  if (pressedBackdrop && event.target === dialog.value) emit('close');
  pressedBackdrop = false;
}
</script>

<template>
  <dialog
    ref="dialog"
    class="ob"
    tabindex="-1"
    :aria-labelledby="titleId"
    aria-modal="true"
    @cancel.prevent="emit('close')"
    @keydown="onKey"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <div class="ob__panel">
      <div class="ob__bar">
        <button v-if="choice" type="button" class="ob__back" @click="back">
          <LucideIcon name="arrow-left" /> Back
        </button>
        <button type="button" class="ob__close" aria-label="Close" @click="emit('close')">
          <LucideIcon name="x" />
        </button>
      </div>
      <h2 :id="titleId" ref="heading" class="ob__title" tabindex="-1">{{ title }}</h2>
      <div v-if="!choice" class="demo-form ob__form">
        <FormRenderer
          :definition="definition"
          :initial-values="initial"
          :components="components"
          :progress-component="noProgress"
          :on-before-step-change="onBeforeStepChange"
        />
      </div>
      <slot v-else :choice="choice" />
      <p class="ob__caption">This form is built with Formhaus.</p>
    </div>
  </dialog>
</template>

<style scoped src="./onboarding.css"></style>
