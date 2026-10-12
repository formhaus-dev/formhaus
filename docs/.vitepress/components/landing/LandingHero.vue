<script setup lang="ts">
import LandingActions from './LandingActions.vue';
import LandingHeroVideo from './LandingHeroVideo.vue';
import McpCommand from './McpCommand.vue';
</script>

<template>
  <section class="hero lp-container" aria-labelledby="hero-title">
    <div class="hero__copy">
      <h1 id="hero-title" class="hero__title">The form framework for the AI&nbsp;era.</h1>
      <p class="hero__lead">
        One JSON definition. Your agent publishes it and hands back a link, an embed, an endpoint and a webhook.
        The same file renders natively in React, Vue and Figma.
      </p>
      <LandingActions class="hero__actions" />
    </div>
    <LandingHeroVideo class="hero__video" />
    <McpCommand id="hero-mcp" class="hero__mcp" />
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-areas: 'copy' 'video' 'mcp';
  gap: 40px;
  padding-top: 48px;
}

.hero__copy { grid-area: copy; }
.hero__video { grid-area: video; }
.hero__mcp { grid-area: mcp; }

.lp .hero__title {
  margin: 0;
  font-size: 36px;
  line-height: 40px;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.hero__lead {
  margin: 24px 0 0;
  font-size: 18px;
  line-height: 28px;
  color: var(--vp-c-text-2);
  text-wrap: pretty;
}

.hero__actions {
  margin-top: 32px;
}

@media (min-width: 960px) {
  .hero {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-areas: none;
    column-gap: 24px;
    row-gap: 32px;
    align-items: center;
    padding-top: 80px;
  }

  .hero__copy { grid-area: 1 / 1 / 2 / 7; }
  .hero__video { grid-area: 1 / 7 / 3 / 13; }
  .hero__mcp { grid-area: 2 / 1 / 3 / 7; align-self: start; }

  .lp .hero__title {
    font-size: 56px;
    line-height: 60px;
  }
}
</style>
