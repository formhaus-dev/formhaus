<script setup lang="ts">
import { defineAsyncComponent, nextTick, ref } from 'vue';
import LucideIcon from './LucideIcon.vue';
import OnboardingNext from './OnboardingNext.vue';

const load = () => import('./onboarding-lazy').then((lazy) => lazy.loadModal());
const OnboardingModal = defineAsyncComponent(load);
const open = ref(false);
const trigger = ref<HTMLAnchorElement>();

function onOpen(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  open.value = true;
}

async function onClose() {
  open.value = false;
  await nextTick();
  trigger.value?.focus();
}
</script>

<template>
  <div class="actions">
    <a
      ref="trigger"
      class="actions__primary lp-button"
      href="/cloud/quickstart"
      target="_self"
      aria-haspopup="dialog"
      @click="onOpen"
      @pointerenter="load"
      @focus="load"
    >Publish your first form</a>
    <a class="lp-link" href="/guide/">Install the library <LucideIcon name="arrow-right" /></a>
    <OnboardingModal v-if="open" v-slot="{ choice }" @close="onClose">
      <OnboardingNext :choice="choice" />
    </OnboardingModal>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px 24px;
}

@media (max-width: 479px) {
  .actions {
    row-gap: 24px;
  }

  .actions__primary {
    justify-content: center;
    width: 100%;
  }
}
</style>
