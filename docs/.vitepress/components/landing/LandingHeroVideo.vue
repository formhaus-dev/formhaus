<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import LucideIcon from './LucideIcon.vue';
import './hero-video.css';

const hiDpiWide = '(min-width: 960px) and (min-resolution: 1.5dppx)';
const narrow = '(max-width: 639px)';
const posterSizes = '(min-width: 1200px) 1152px, calc(100vw - 32px)';
const props = withDefaults(defineProps<{ prefix?: string; start?: number; length?: number; mobileLength?: number; caption?: string }>(), {
  prefix: 'formhaus-hero',
  start: 5,
  length: 33,
  mobileLength: 22,
  caption: 'An agent writes a waitlist form and publishes it. The same form runs in React, Vue, a hosted page and Figma. Someone fills it in, and the response lands in the dashboard, a webhook and a CSV file.',
});
const themes = [
  { name: 'light', base: `/media/${props.prefix}`, mobile: `/media/${props.prefix}-mobile` },
  { name: 'dark', base: `/media/${props.prefix}-dark`, mobile: `/media/${props.prefix}-mobile-dark` },
].map((t) => ({
  ...t,
  srcset: [640, 1280, 1920, 2560].map((w) => `${t.base}-poster-${w}.jpg ${w}w`).join(', '),
  mobileSrcset: [640, 1280].map((w) => `${t.mobile}-poster-${w}.jpg ${w}w`).join(', '),
}));

const { isDark } = useData();
const video = ref<HTMLVideoElement>();
const figure = ref<HTMLElement>();
const poster = ref<string>();
const ready = ref(false);
const wanted = ref(false);
const started = ref(false);
const playing = ref(false);
const mobile = ref(false);
let visible = false;
let observer: IntersectionObserver | undefined;

const theme = computed(() => themes[isDark.value ? 1 : 0]);
const base = computed(() => (mobile.value ? theme.value.mobile : theme.value.base));
const startAt = computed(() => (mobile.value ? 0 : props.start));
const duration = computed(() => (mobile.value ? props.mobileLength : props.length));
const sources = computed(() => mobile.value ? [
  { src: `${base.value}-1080.mp4`, type: 'video/mp4', media: '(min-resolution: 2dppx)' },
  { src: `${base.value}-720.mp4`, type: 'video/mp4' },
  { src: `${base.value}-720.webm`, type: 'video/webm' },
] : [
  { src: `${base.value}-1440.webm`, type: 'video/webm', media: hiDpiWide },
  { src: `${base.value}-1440.mp4`, type: 'video/mp4', media: hiDpiWide },
  { src: `${base.value}-1080.webm`, type: 'video/webm' },
  { src: `${base.value}-1080.mp4`, type: 'video/mp4' },
]);

function sync() {
  const el = video.value;
  if (!el) return;
  if (wanted.value && visible) el.play().catch(() => { wanted.value = false; });
  else el.pause();
}

function toggle() {
  wanted.value = !playing.value;
  sync();
}

function onPlay() {
  const el = video.value;
  if (!started.value && el && el.currentTime < startAt.value) el.currentTime = startAt.value;
  started.value = true;
  playing.value = true;
}

function syncPoster() {
  const img = figure.value?.querySelector<HTMLImageElement>(`.hero-video__poster--${isDark.value ? 'dark' : 'light'}`);
  if (img?.complete && img.currentSrc) poster.value = img.currentSrc;
}

watch(isDark, async () => {
  const el = video.value;
  if (!el) return;
  const time = el.currentTime;
  await nextTick();
  el.load();
  el.currentTime = time;
  syncPoster();
  sync();
});

onMounted(async () => {
  mobile.value = matchMedia(narrow).matches;
  wanted.value = matchMedia('(min-width: 640px) and (prefers-reduced-motion: no-preference)').matches;
  ready.value = true;
  syncPoster();
  await nextTick();
  video.value?.load();
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  if (video.value) observer.observe(video.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure ref="figure" class="hero-video" :class="{ 'hero-video--started': started }">
    <picture v-for="t in themes" :key="t.name">
      <source :media="narrow" :srcset="t.mobileSrcset" :sizes="posterSizes" />
      <img
        :srcset="t.srcset"
        :sizes="posterSizes"
        :class="['hero-video__poster', `hero-video__poster--${t.name}`]"
        :src="`${t.base}-poster-1280.jpg`"
        width="1280"
        height="720"
        alt=""
        fetchpriority="high"
        @load="syncPoster"
      />
    </picture>
    <video
      ref="video"
      class="hero-video__media"
      :autoplay="wanted"
      muted
      loop
      playsinline
      preload="metadata"
      :poster="poster"
      :aria-label="`Formhaus product tour, ${duration} seconds, silent`"
      aria-describedby="hero-video-caption"
      @play="onPlay"
      @pause="playing = false"
    >
      <template v-if="ready">
        <source v-for="s in sources" :key="s.src" :src="s.src" :type="s.type" :media="s.media" />
      </template>
    </video>
    <figcaption id="hero-video-caption" class="lp-sr-only">{{ props.caption }}</figcaption>
    <button v-if="ready && !started" type="button" class="hero-video__start" @click="toggle">
      <LucideIcon name="play" />
      <span>Play video</span>
      <span class="hero-video__time">· 0:{{ duration }}</span>
    </button>
    <button
      type="button"
      :class="['hero-video__toggle', { 'hero-video__toggle--idle': !started }]"
      :aria-label="playing ? 'Pause video' : 'Play video'"
      @click="toggle"
    >
      <LucideIcon :name="playing ? 'pause' : 'play'" />
    </button>
  </figure>
</template>
