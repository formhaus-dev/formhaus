<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { promoKey, promoVariant } from './promo';

const { page } = useData();
const variant = computed(() => promoVariant(page.value.relativePath));
const dismissed = ref(false);

const content = {
  cloud: {
    label: 'Formhaus framework',
    lead: 'Developer?',
    leadShort: 'Developer?',
    rest: 'The Formhaus framework is free and open source.',
    link: 'Try the framework',
    href: '/framework',
  },
  framework: {
    label: 'Formhaus Cloud',
    lead: "Don't want to run a backend?",
    leadShort: 'No backend?',
    rest: 'Formhaus Cloud hosts your forms.',
    link: 'Try Cloud',
    href: '/',
  },
};
const item = computed(() => (variant.value ? content[variant.value] : null));

function read(name: string) {
  try {
    return localStorage.getItem(promoKey(name)) === '1';
  } catch {
    return false;
  }
}

function sync() {
  dismissed.value = variant.value ? read(variant.value) : true;
  document.documentElement.classList.toggle('fh-promo-off', dismissed.value);
}

function close() {
  if (!variant.value) return;
  try {
    localStorage.setItem(promoKey(variant.value), '1');
  } catch {}
  dismissed.value = true;
  document.documentElement.classList.add('fh-promo-off');
}

onMounted(sync);
watch(variant, sync);
</script>

<template>
  <div v-if="item && !dismissed" class="fh-promo" role="region" :aria-label="item.label">
    <p class="fh-promo__text"><strong class="fh-promo__lead"><span class="fh-promo__long">{{ item.lead }}</span><span class="fh-promo__short">{{ item.leadShort }}</span></strong> <span class="fh-promo__long">{{ item.rest }}</span> <a class="fh-promo__link" :href="item.href" data-umami-event="promo-click" :data-umami-event-variant="variant">{{ item.link }} <span aria-hidden="true">→</span></a></p>
    <button type="button" class="fh-promo__close" aria-label="Close" @click="close">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    </button>
  </div>
</template>
