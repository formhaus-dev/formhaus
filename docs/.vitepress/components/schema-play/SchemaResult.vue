<script setup lang="ts">
import { computed } from 'vue';
import LucideIcon from '../landing/LucideIcon.vue';
import type { Run } from './use-schema';

const props = defineProps<{ run?: Run }>();

const action = computed(() => {
  const context = props.run?.context;
  if (!context) return '';
  const name = context.submit ? 'Submit' : 'Continue';
  return context.stepId ? `${name} · step ${context.stepId}` : name;
});
const outcome = computed(() => props.run?.outcome);
const errors = computed(() => (outcome.value && 'errors' in outcome.value ? Object.entries(outcome.value.errors) : []));
const badge = computed(() => {
  if (!outcome.value) return { kind: 'busy', text: 'Running' };
  if ('problem' in outcome.value) return { kind: 'error', text: 'Failed' };
  const count = errors.value.length;
  return count ? { kind: 'error', text: `${count} ${count === 1 ? 'error' : 'errors'}` } : { kind: 'ok', text: 'No errors' };
});
</script>

<template>
  <section class="play-issues sp-result" aria-label="Last run" aria-live="polite">
    <p v-if="!run" class="sp-result__empty">Press Continue or Submit to run onValidate.</p>
    <template v-else>
      <p class="sp-result__head">
        <strong>Last run</strong>
        <span>{{ action }}</span>
        <span class="sp-result__badge" :data-kind="badge.kind">{{ badge.text }}</span>
      </p>
      <ul v-if="outcome" class="sp-result__list">
        <li v-if="'problem' in outcome">
          <span class="play-issues__row">
            <LucideIcon name="circle-alert" />
            <span class="play-issues__text">{{ outcome.problem.message }}</span>
            <code class="play-issues__path">{{ outcome.problem.line ? `schema.ts, line ${outcome.problem.line}` : 'onValidate' }}</code>
          </span>
        </li>
        <li v-for="[key, message] in errors" :key="key">
          <span class="play-issues__row">
            <LucideIcon name="circle-alert" />
            <span class="play-issues__text">{{ message }}</span>
            <code class="play-issues__path">{{ key || 'form' }}</code>
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>
