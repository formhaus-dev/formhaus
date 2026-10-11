<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { formatJson, tokenize } from '../landing/json-format';
import LucideIcon from '../landing/LucideIcon.vue';
import { categoryLabel, cloudUrl, counts, type TemplatePage } from './catalog';
import { templatePrompt } from './prompt';
import './templates.css';
import './detail.css';

const TemplatePreview = defineAsyncComponent(() => import('./TemplatePreview.vue'));

const { params } = useData();
const template = computed(() => params.value as TemplatePage);
const source = computed(() => formatJson(template.value.definition));
const lines = computed(() => tokenize(source.value));
const copied = ref<'' | 'JSON' | 'Prompt'>('');
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(kind: 'JSON' | 'Prompt') {
  const text = kind === 'JSON' ? source.value : templatePrompt(template.value.title, template.value.slug);
  try {
    await navigator.clipboard.writeText(text);
    copied.value = kind;
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = ''; }, 2000);
  } catch {
    copied.value = '';
  }
}
</script>

<template>
  <div class="tpl-detail">
    <a class="tpl-back" :href="withBase('/templates/')"><LucideIcon name="arrow-left" /> All templates</a>
    <p class="tpl-detail__eyebrow">
      <a :href="withBase(`/templates/?category=${template.category}`)">{{ categoryLabel(template.category) }}</a>
      <span aria-hidden="true">·</span> {{ counts(template) }}
    </p>
    <h1 class="tpl-detail__title">{{ template.title }}</h1>
    <p class="tpl-detail__summary">{{ template.summary }}</p>
    <div class="tpl-detail__actions">
      <a class="tpl-button tpl-button--primary" :href="cloudUrl(template.slug)">
        Launch free <LucideIcon name="arrow-right" />
      </a>
    </div>
    <p class="tpl-detail__hint">Get a hosted link and a responses inbox in a minute. No backend, no credit card.</p>
    <div class="tpl-detail__alt" role="group" aria-labelledby="tpl-alt-label">
      <p id="tpl-alt-label" class="tpl-detail__alt-label">Or set it up yourself</p>
      <button type="button" class="tpl-button tpl-button--secondary" @click="copy('Prompt')">
        <LucideIcon :name="copied === 'Prompt' ? 'check' : 'bot'" /> {{ copied === 'Prompt' ? 'Copied' : 'Copy prompt for your AI agent' }}
      </button>
      <button type="button" class="tpl-button tpl-button--secondary" @click="copy('JSON')">
        <LucideIcon :name="copied === 'JSON' ? 'check' : 'copy'" /> {{ copied === 'JSON' ? 'Copied' : 'Copy JSON for React or Vue' }}
      </button>
      <span class="tpl-sr-only" role="status">{{ copied ? `${copied} copied` : '' }}</span>
    </div>

    <section class="tpl-preview" aria-label="Live preview">
      <p class="tpl-preview__label">Live preview</p>
      <ClientOnly>
        <TemplatePreview :definition="template.definition" />
      </ClientOnly>
    </section>

    <details class="tpl-json">
      <summary class="tpl-json__summary">
        Form definition <span class="tpl-json__meta">JSON · {{ lines.length }} lines</span>
        <LucideIcon name="chevron-down" />
      </summary>
      <pre class="tpl-json__pre"><code><span v-for="(line, index) in lines" :key="index" class="tpl-json__line"><span v-for="(token, position) in line" :key="position" :class="`tpl-json__${token.kind}`">{{ token.text }}</span></span></code></pre>
    </details>

    <slot />
  </div>
</template>
