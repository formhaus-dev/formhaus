<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import template from '../../../../templates/contact-form.json';
import { handRolled, highlight, withFormhaus } from './toggle-code';

const LandingDemoForm = defineAsyncComponent(() => import('./LandingDemoForm.vue'));

const definition = template.definition as FormDefinition;
const panes = [
  { id: 'off', lines: highlight(handRolled.source), note: `+ ${handRolled.total - handRolled.source.split('\n').length} more lines` },
  { id: 'on', lines: highlight(withFormhaus.source), note: 'End of file. The fields are in contact-form.json.' },
];
const on = ref(false);
const card = ref<HTMLElement>();
let touched = false;
let observer: IntersectionObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function flip() {
  touched = true;
  clearTimeout(timer);
  on.value = !on.value;
}

onMounted(() => {
  if (!card.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer?.disconnect();
    timer = setTimeout(() => { if (!touched) on.value = true; }, 1600);
  }, { threshold: 0.6 });
  observer.observe(card.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(timer);
});
</script>

<template>
  <section class="lp-section" aria-labelledby="toggle-title">
    <p class="lp-eyebrow">Less code</p>
    <h2 id="toggle-title" class="lp-title">Same form, a fraction of the code</h2>
    <p class="lp-lead">Written by hand, this contact form is {{ handRolled.total }} lines of React. With Formhaus it is {{ withFormhaus.total }} lines and a JSON file.</p>
    <div ref="card" class="toggle" :data-on="on">
      <div class="toggle__code">
        <button
          type="button"
          role="switch"
          class="toggle__strip"
          :aria-checked="on"
          aria-labelledby="toggle-label"
          aria-describedby="toggle-meta"
          @click="flip"
        >
          <span class="toggle__track" aria-hidden="true"><span class="toggle__thumb" /></span>
          <span id="toggle-label" class="toggle__label">With Formhaus</span>
          <span id="toggle-meta" class="toggle__meta"><span class="toggle__file">ContactForm.tsx · </span>{{ on ? withFormhaus.total : handRolled.total }} lines</span>
        </button>
        <div class="toggle__editor">
          <pre
            v-for="pane in panes"
            :key="pane.id"
            class="toggle__pre"
            :data-pane="pane.id"
            :aria-hidden="(pane.id === 'on') !== on"
            :aria-label="pane.id === 'on' ? 'Contact form with Formhaus' : 'Contact form written by hand, first lines'"
          ><code><span
            v-for="(line, index) in pane.lines"
            :key="index"
            class="toggle__line"
            :style="{ '--i': index }"
          ><span class="toggle__num">{{ index + 1 }}</span><span
            v-for="(token, position) in line"
            :key="position"
            :class="`toggle__${token.kind}`"
          >{{ token.text }}</span></span></code><span class="toggle__more">{{ pane.note }}</span></pre>
        </div>
      </div>
      <div class="toggle__form">
        <ClientOnly>
          <LandingDemoForm :definition="definition" />
        </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped src="./toggle.css"></style>
<style scoped src="./toggle-code.css"></style>
