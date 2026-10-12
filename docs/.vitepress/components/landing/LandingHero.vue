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
        Describe a form to share, embed, or use in your app.
      </p>
      <LandingActions class="hero__actions" />
    </div>
    <McpCommand id="hero-mcp" class="hero__mcp" />
    <LandingHeroVideo class="hero__video" />
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-areas: 'copy' 'mcp' 'video';
  gap: 40px;
  padding-top: 48px;
}

.hero__copy { grid-area: copy; }
.hero__video { grid-area: video; }
.hero__mcp { grid-area: mcp; }

.hero__copy,
.hero__mcp {
  text-align: center;
}

.hero__mcp :deep(.mcp__tabs) {
  justify-content: center;
}

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
    padding-top: 80px;
    gap: 48px;
  }

  .hero__copy,
  .hero__mcp {
    max-width: 760px;
    margin: 0 auto;
  }

  .lp .hero__title {
    font-size: 56px;
    line-height: 60px;
  }
}
</style>
