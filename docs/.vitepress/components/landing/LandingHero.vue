<script setup lang="ts">
import CopyLine from './CopyLine.vue';
import LucideIcon from './LucideIcon.vue';

const facts = ['MIT', 'Core 6.2 KB gzipped', 'Zero dependencies', 'Any framework'];
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <h1 id="hero-title" class="hero__title">
      Write the form once. <span class="hero__accent">Ship it everywhere.</span>
    </h1>
    <p class="hero__lead">
      One JSON file runs your React and Vue forms, Figma mockups and AI agents.
    </p>
    <div class="hero__actions">
      <a class="hero__button hero__button--brand" href="/guide/">Get started <LucideIcon name="arrow-right" /></a>
      <a class="hero__button" href="/playground">Playground</a>
    </div>
    <CopyLine class="hero__install" command="npm i @formhaus/core @formhaus/react" label="Copy install command" />
    <ul class="hero__facts" aria-label="Key facts">
      <li v-for="fact in facts" :key="fact">{{ fact }}</li>
    </ul>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  max-width: 920px;
  margin: 0 auto;
  padding: 56px 0 8px;
  text-align: center;
}

.hero::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--vp-nav-height) - 80px) 0 auto;
  height: calc(var(--vp-nav-height) + 520px);
  z-index: -1;
  background: radial-gradient(ellipse at 50% 40%, var(--vp-c-brand-soft), transparent 70%);
  pointer-events: none;
}

.hero .hero__title {
  margin: 0;
  font-size: 36px;
  line-height: 1.12;
  letter-spacing: -0.03em;
  font-weight: 800;
  color: var(--vp-c-text-1);
  text-wrap: balance;
}

.hero__accent {
  display: inline-block;
  background: linear-gradient(120deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero .hero__lead {
  max-width: 640px;
  margin: 20px auto 0;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  text-wrap: pretty;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.hero .hero__button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  min-height: 44px;
  border: 1px solid var(--vp-button-alt-border);
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  color: var(--vp-button-alt-text);
  background: var(--vp-button-alt-bg);
  transition: background-color 0.2s, border-color 0.2s;
}

.hero .hero__button:hover {
  border-color: var(--vp-button-alt-hover-border);
  background: var(--vp-button-alt-hover-bg);
}

.hero .hero__button--brand {
  border-color: transparent;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
}

.hero .hero__button--brand:hover {
  border-color: transparent;
  color: var(--vp-button-brand-hover-text);
  background: var(--vp-button-brand-hover-bg);
}

.hero__install {
  width: 420px;
  margin: 28px auto 0;
  text-align: left;
}

.hero .hero__facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.hero .hero__facts li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.hero .hero__facts li::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-2);
}

@media (min-width: 640px) {
  .hero {
    padding-top: 80px;
  }

  .hero .hero__title {
    font-size: 56px;
  }

  .hero .hero__lead {
    font-size: 20px;
  }
}

@media (max-width: 479px) {
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero .hero__button {
    justify-content: center;
  }
}
</style>
