<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import CopyLine from './CopyLine.vue';
import LucideIcon from './LucideIcon.vue';
import McpCommand from './McpCommand.vue';
import { highlight, panes } from './app-code';
import type { StartChoice } from './onboarding';

const props = defineProps<{ choice: StartChoice }>();
const uid = useId();
const frameworks = ['react', 'vue'].map((id) => {
  const pane = panes.find((item) => item.id === id)!;
  return { id, label: pane.label, install: `npm i @formhaus/core @formhaus/${id}`, lines: highlight(pane.source) };
});
const activeId = ref(frameworks[0].id);
const active = computed(() => frameworks.find((item) => item.id === activeId.value) ?? frameworks[0]);

function onKey(event: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  const next = frameworks[(frameworks.indexOf(active.value) + step + frameworks.length) % frameworks.length];
  activeId.value = next.id;
  document.getElementById(`${uid}-${next.id}`)?.focus();
}
</script>

<template>
  <div class="ob-next">
    <template v-if="props.choice === 'browser'">
      <a class="ob-next__primary lp-button" href="/build">Open the builder</a>
    </template>

    <template v-else-if="props.choice === 'agent'">
      <McpCommand :id="`${uid}-mcp`" :note="false" />
      <p class="ob-next__label">Then ask your agent</p>
      <CopyLine command="Make me a waitlist form and give me the link." label="Copy prompt" />
      <p class="ob-next__lead">No account needed for the first form.</p>
      <a class="lp-link" href="/cloud/quickstart#agents">Agent setup guide <LucideIcon name="arrow-right" /></a>
    </template>

    <template v-else>
      <div class="ob-next__switch" role="tablist" aria-label="Framework" @keydown="onKey">
        <button
          v-for="item in frameworks"
          :id="`${uid}-${item.id}`"
          :key="item.id"
          type="button"
          role="tab"
          class="ob-next__segment"
          :aria-selected="item.id === activeId"
          :tabindex="item.id === activeId ? 0 : -1"
          @click="activeId = item.id"
        >{{ item.label }}</button>
      </div>
      <div class="ob-next__panel" role="tabpanel" :aria-labelledby="`${uid}-${active.id}`">
        <CopyLine :command="active.install" :label="`Copy ${active.label} install command`" prompt="$" />
        <div class="app__code ob-next__code">
          <pre :key="active.id" class="app__pre"><code><span
            v-for="(line, index) in active.lines"
            :key="index"
            class="app__line"
            :style="{ '--i': index }"
          ><span class="app__num">{{ index + 1 }}</span><span
            v-for="(token, position) in line"
            :key="position"
            :class="`app__${token.kind}`"
          >{{ token.text }}</span></span></code></pre>
        </div>
      </div>
      <a class="lp-link" href="/guide/">Read the guide <LucideIcon name="arrow-right" /></a>
    </template>
  </div>
</template>

<style scoped src="./app-code.css"></style>
<style scoped src="./onboarding-next.css"></style>
