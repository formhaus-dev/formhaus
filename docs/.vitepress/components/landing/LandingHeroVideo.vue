<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import LucideIcon from './LucideIcon.vue';
import './hero-video.css';

const hiDpiWide = '(min-width: 960px) and (min-resolution: 1.5dppx)';
const posterTime = 5;
const posterSizes = '(min-width: 1200px) 564px, (min-width: 960px) 50vw, calc(100vw - 48px)';
const themes = [
  { name: 'light', base: '/media/formhaus-promo' },
  { name: 'dark', base: '/media/formhaus-promo-dark' },
].map((t) => ({ ...t, srcset: [640, 1280, 1920].map((w) => `${t.base}-poster-${w}.webp ${w}w`).join(', ') }));

const { isDark } = useData();
const video = ref<HTMLVideoElement>();
const figure = ref<HTMLElement>();
const poster = ref<string>();
const ready = ref(false);
const wanted = ref(false);
const started = ref(false);
const playing = ref(false);
let visible = false;
let observer: IntersectionObserver | undefined;

const base = computed(() => themes[isDark.value ? 1 : 0].base);
const sources = computed(() => [
  { src: `${base.value}-1080.webm`, type: 'video/webm', media: hiDpiWide },
  { src: `${base.value}-1080.mp4`, type: 'video/mp4', media: hiDpiWide },
  { src: `${base.value}-720.webm`, type: 'video/webm' },
  { src: `${base.value}-720.mp4`, type: 'video/mp4' },
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
  wanted.value = matchMedia('(min-width: 640px) and (prefers-reduced-motion: no-preference)').matches;
  ready.value = true;
  syncPoster();
  await nextTick();
  if (video.value) {
    video.value.load();
    video.value.currentTime = posterTime;
  }
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
      <source type="image/webp" :srcset="t.srcset" :sizes="posterSizes" />
      <img
        :class="['hero-video__poster', `hero-video__poster--${t.name}`]"
        :src="`${t.base}-poster-1280.jpg`"
        width="1280"
        height="720"
        alt=""
        loading="lazy"
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
      aria-label="Formhaus product tour, 33 seconds, silent"
      aria-describedby="hero-video-caption"
      @play="onPlay"
      @pause="playing = false"
    >
      <template v-if="ready">
        <source v-for="s in sources" :key="s.src" :src="s.src" :type="s.type" :media="s.media" />
      </template>
    </video>
    <figcaption id="hero-video-caption" class="lp-sr-only">
      An agent is asked for a waitlist form and writes one JSON definition.
      It renders in React, Vue, a hosted page and Figma.
      The agent publishes a link, someone fills the form in, and the responses arrive.
    </figcaption>
    <button v-if="ready && !started" type="button" class="hero-video__start" @click="toggle">
      <LucideIcon name="play" />
      <span>Play video</span>
      <span class="hero-video__time">0:33</span>
    </button>
    <button
      type="button"
      class="hero-video__toggle"
      :aria-label="playing ? 'Pause video' : 'Play video'"
      @click="toggle"
    >
      <LucideIcon :name="playing ? 'pause' : 'play'" />
    </button>
  </figure>
</template>
