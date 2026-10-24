<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import PlaySkeleton from './PlaySkeleton.vue';
import { formDefinition, type PlayForm, playForms } from './play-catalog';
import { appUrl, designs } from './play-state';
import { usePreviews } from './previews';

const props = defineProps<{ system: string; form: PlayForm }>();
const { isDark } = useData();
const definition = shallowRef<object | null>(null);
const busy = ref(false);
const settled = ref(false);
const fetching = ref(false);
const stage = ref<HTMLElement>();
const previews = usePreviews(definition, isDark, (id) => {
  if (id !== props.system) return;
  busy.value = false;
  settled.value = true;
});
const started = ref(false);
const loading = computed(
  () => started.value && (fetching.value || (!previews.rendered.has(props.system) && !previews.issues.has(props.system))),
);
const label = computed(() => `Loading the ${designs.find((entry) => entry.id === props.system)?.label} preview`);
let token = 0;
let observer: IntersectionObserver | undefined;

async function sync() {
  const mine = ++token;
  previews.open(props.system);
  fetching.value = true;
  const value = await formDefinition(props.form).catch(() => null);
  if (mine !== token) return;
  fetching.value = false;
  if (!value) return;
  definition.value = value;
  busy.value = previews.send(props.system);
}

function start() {
  if (started.value) return;
  started.value = true;
  observer?.disconnect();
  sync();
}

watch(
  () => [props.system, props.form.key],
  () => {
    if (props.system !== designs[0]!.id || props.form.key !== playForms[0]!.key) settled.value = true;
    if (started.value) sync();
  },
);

onMounted(() => {
  if (!('IntersectionObserver' in window) || !stage.value) return start();
  observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && start(), { rootMargin: '200px' });
  observer.observe(stage.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="stage" class="lv-stage" :data-busy="busy || undefined">
    <picture v-for="scheme in ['light', 'dark']" :key="scheme" :class="`lv-still lv-still--${scheme}`" :data-gone="settled || undefined">
      <source media="(max-width: 767px)" :srcset="`/play/still-phone-${scheme}.webp`" />
      <img :src="`/play/still-desk-${scheme}.webp`" alt="" decoding="async" />
    </picture>
    <template v-for="entry in designs" :key="entry.id">
      <iframe
        v-if="previews.loaded.has(entry.id)"
        v-show="entry.id === system"
        :ref="(element) => previews.bind(entry.id, element)"
        :src="appUrl(entry)"
        :title="`${entry.label} preview`"
        class="lv-frame"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </template>
    <div class="lv-busy" />
    <PlaySkeleton v-if="loading && settled" :label="label" />
  </div>
</template>
