<script setup lang="ts">
const recipes = [
  { title: 'Multi-step with branching', text: 'Routes pick the next step.', href: '/recipes/multi-step-branching' },
  { title: 'Conditional fields', text: 'Show fields from answers.', href: '/recipes/conditional-fields' },
  { title: 'Quiz funnel', text: 'One question per step.', href: '/recipes/quiz-funnel' },
  { title: 'Headless engine', text: 'Plain JavaScript or Svelte.', href: '/recipes/headless-engine' },
  { title: 'Figma to React', text: 'Design and code from one file.', href: '/recipes/figma-to-react' },
  { title: 'AI agents', text: 'Generate and check forms.', href: '/recipes/ai-agents' },
];

const integrations = [
  { title: 'Next.js', href: '/guide/integrations/nextjs' },
  { title: 'Nuxt', href: '/guide/integrations/nuxt' },
  { title: 'shadcn/ui', href: '/guide/integrations/shadcn' },
  { title: 'Material UI', href: '/guide/integrations/mui' },
  { title: 'Vuetify', href: '/guide/integrations/vuetify' },
];
</script>

<template>
  <section class="lp-section" aria-labelledby="recipes-title">
    <p class="lp-eyebrow">Examples</p>
    <h2 id="recipes-title" class="lp-title">Recipes and integrations</h2>
    <ul class="recipes" aria-label="Recipes">
      <li v-for="item in recipes" :key="item.href">
        <a class="recipes__card" :href="item.href">
          <span class="recipes__name">{{ item.title }}</span>
          <span class="recipes__text">{{ item.text }}</span>
        </a>
      </li>
    </ul>
    <div class="integrations">
      <h3 class="integrations__title">Works with</h3>
      <ul class="integrations__list">
        <li v-for="item in integrations" :key="item.href"><a :href="item.href">{{ item.title }}</a></li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.vp-doc .recipes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 12px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

.vp-doc .recipes li {
  margin: 0;
}

.vp-doc .recipes__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  padding: 18px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
}

.vp-doc .recipes__card:hover {
  border-color: var(--vp-c-brand-1);
}

.recipes__name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.recipes__text {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.integrations {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-top: 28px;
}

.vp-doc .integrations__title {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.vp-doc .integrations__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vp-doc .integrations__list li {
  margin: 0;
}

.vp-doc .integrations__list a {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.vp-doc .integrations__list a:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 639px) {
  .vp-doc .integrations__list a {
    padding: 11px 16px;
  }
}
</style>
