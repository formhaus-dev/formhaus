<script setup lang="ts">
import type { FormDefinition } from '@formhaus/core';
import { ref } from 'vue';
import EditorIsland from '../editor/EditorIsland.vue';
import LandingSection from '../landing/LandingSection.vue';
import SectionCta from '../landing/SectionCta.vue';
import webinar from './webinar.json';

const definition = webinar as FormDefinition;
const start = JSON.stringify(definition);
const pane = ref<HTMLElement | null>(null);

function onChange(next: FormDefinition) {
  try {
    if (JSON.stringify(next) === start) sessionStorage.removeItem('fh:build:carry');
    else sessionStorage.setItem('fh:build:carry', JSON.stringify(next));
  } catch {}
}

function stepTitle(box: HTMLElement) {
  return [...box.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>('textarea, input')].find((el) => el.value === 'Your session');
}

function onReady(tries = 30) {
  const box = pane.value;
  const step = box && stepTitle(box);
  if (!box) return;
  if (!step) {
    if (tries > 0) requestAnimationFrame(() => onReady(tries - 1));
    return;
  }
  const label = [...box.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent?.trim() === 'Step 2');
  const top = Math.min(step.getBoundingClientRect().top, label?.getBoundingClientRect().top ?? Infinity);
  box.scrollTop += top - box.getBoundingClientRect().top - 16;
}
</script>

<template>
  <LandingSection id="builder" title="Easy to build, easy to change" lead="Arrange fields, split long forms into steps, and add logic in a click.">
    <p class="builder-try">Try it here</p>
    <div ref="pane" class="cloud-frame builder-live">
      <ClientOnly>
        <EditorIsland storage="memory" compact lazy :definition="definition" @change="onChange" @ready="onReady()" />
      </ClientOnly>
    </div>
    <SectionCta href="/build" label="Open the builder" />
  </LandingSection>
</template>

<style scoped>
.builder-try { max-width: 880px; margin: 0 auto 12px; font-size: 14px; line-height: 20px; text-align: center; color: var(--vp-c-text-2); }
.builder-live { box-sizing: border-box; max-width: 880px; height: 560px; margin: 0 auto; padding: 16px; overflow: auto; overscroll-behavior: contain; }
@media (max-width: 767px) {
  .builder-live { height: 520px; padding: 12px; }
}
</style>
