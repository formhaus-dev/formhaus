<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { NODE, type FlowGraph } from './flow-graph';
import type { FlowState } from './flow-state';

defineProps<{ graph: FlowGraph; state: FlowState }>();

const scroller = ref<HTMLElement>();
const wide = ref(false);
let observer: ResizeObserver | undefined;
const measure = () => { wide.value = !!scroller.value && scroller.value.scrollWidth > scroller.value.clientWidth + 1; };
const short = (label: string) => (label.length > 16 ? `${label.slice(0, 15)}…` : label);

onMounted(() => {
  observer = new ResizeObserver(measure);
  if (scroller.value) observer.observe(scroller.value);
  measure();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="scroller" class="flow" :data-wide="wide" :style="{ '--flow-width': `${graph.width}px` }">
    <svg
      class="flow__svg"
      :viewBox="`0 0 ${graph.width} ${graph.height}`"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <TransitionGroup tag="g" name="flow-fade">
        <g v-for="edge in graph.edges" :key="edge.id" class="flow__edge" :data-state="state.edges[edge.id]">
          <path class="flow__track" :d="edge.d" />
          <path class="flow__line" :d="edge.d" pathLength="1" />
        </g>
      </TransitionGroup>
      <TransitionGroup tag="g" name="flow-fade">
        <g
          v-for="node in graph.nodes"
        :key="node.id"
        class="flow__node"
        :data-state="state.nodes[node.id]"
        :transform="`translate(${node.x} ${node.y})`"
      >
        <rect class="flow__box" :width="NODE.width" :height="NODE.height" rx="18" />
          <title>{{ node.label }}</title>
          <text class="flow__label" :x="NODE.width / 2" :y="NODE.height / 2">{{ short(node.label) }}</text>
        </g>
      </TransitionGroup>
    </svg>
    <p class="lp-sr-only" aria-live="polite">{{ state.summary }}</p>
  </div>
</template>

<style scoped>
.flow {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.flow::-webkit-scrollbar {
  display: none;
}

.flow[data-wide='true'] {
  mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
}

.flow__svg {
  display: block;
  width: 100%;
  min-width: calc(var(--flow-width) * 0.8);
  max-width: max(min(480px, calc(var(--flow-width) * 1.15)), calc(var(--flow-width) * 0.8));
  height: 100%;
  margin: 0 auto;
  overflow: visible;
}

.flow__track {
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0.55;
  transition: opacity 0.3s;
}

.flow__edge[data-state='open'] .flow__track {
  stroke-dasharray: 5 5;
  opacity: 1;
}

.flow__edge[data-state='dim'] .flow__track {
  opacity: 0.18;
}

.flow__edge[data-state='lit'] .flow__track,
.flow__edge[data-state='preview'] .flow__track {
  opacity: 0;
}

.flow__line {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  transition: stroke-dashoffset 0.5s ease, opacity 0s linear 0.5s;
}

.flow__edge[data-state='lit'] .flow__line,
.flow__edge[data-state='preview'] .flow__line {
  stroke-dashoffset: 0;
  opacity: 1;
  transition: stroke-dashoffset 0.5s ease, opacity 0s;
}

.flow__box {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
  transition: fill 0.3s, stroke 0.3s, opacity 0.3s;
}

.flow__label {
  fill: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  text-anchor: middle;
  dominant-baseline: central;
  transition: fill 0.3s;
}

.flow__node[data-state='visited'] .flow__box {
  stroke: var(--vp-c-brand-1);
}

.flow__node[data-state='visited'] .flow__label {
  fill: var(--vp-c-text-1);
}

.flow__node[data-state='current'] .flow__box {
  fill: var(--vp-c-brand-3);
  stroke: var(--vp-c-brand-3);
}

.flow__node[data-state='current'] .flow__label {
  fill: #fff;
  font-weight: 600;
}

.flow__node {
  transition: opacity 0.3s;
}

.flow__node[data-state='skipped'] {
  opacity: 0.35;
}

.flow-fade-enter-active,
.flow-fade-leave-active {
  transition: opacity 0.2s;
}

.flow-fade-enter-from,
.flow-fade-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .flow__svg {
    min-width: calc(var(--flow-width) * 0.85);
    margin: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-fade-enter-active,
  .flow-fade-leave-active,
  .flow__track,
  .flow__line,
  .flow__box,
  .flow__label,
  .flow__node {
    transition: none;
  }
}
</style>
