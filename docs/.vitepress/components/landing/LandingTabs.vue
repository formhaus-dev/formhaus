<script setup lang="ts">
const tabs = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'headless', label: 'Headless' },
  { id: 'figma', label: 'Figma' },
];
</script>

<template>
  <section class="lp-section" aria-labelledby="everywhere-title">
    <p class="lp-eyebrow">Renderers</p>
    <h2 id="everywhere-title" class="lp-title">Same file in every framework</h2>
    <p class="lp-lead">React and Vue renderers, or the headless core for Svelte, Solid or vanilla JS.</p>
    <div class="tabs">
      <div class="tabs__bar" role="radiogroup" aria-label="Renderer">
        <template v-for="(tab, index) in tabs" :key="tab.id">
          <input
            :id="`lp-tab-${tab.id}`"
            class="tabs__input"
            type="radio"
            name="lp-renderer"
            :value="tab.id"
            :checked="index === 0"
          />
          <label class="tabs__label" :for="`lp-tab-${tab.id}`">{{ tab.label }}</label>
        </template>
      </div>
      <div class="tabs__panels">
        <div v-for="tab in tabs" :key="tab.id" class="tabs__panel" :data-tab="tab.id">
          <h3 class="tabs__heading">{{ tab.label }}</h3>
          <slot :name="tab.id" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tabs {
  margin-top: 40px;
}

.tabs__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  width: fit-content;
  max-width: 100%;
}

.tabs__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.tabs__label {
  flex: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.tabs__label:hover {
  color: var(--vp-c-text-1);
}

.tabs__input:checked + .tabs__label {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.tabs__input:focus-visible + .tabs__label {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.tabs__panels {
  margin-top: 16px;
}

.tabs__panel + .tabs__panel {
  margin-top: 24px;
}

.vp-doc .tabs__heading {
  margin: 0 0 8px;
  padding: 0;
  border: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
}

.tabs__panel :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

@media (max-width: 639px) {
  .tabs__panel :deep(div[class*='language-'] code) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .tabs__label {
    padding: 8px 12px;
  }
}

@supports selector(:has(*)) {
  .tabs__panel {
    display: none;
  }

  .tabs__panel + .tabs__panel {
    margin-top: 0;
  }

  .vp-doc .tabs__heading {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .tabs:has(#lp-tab-react:checked) [data-tab='react'],
  .tabs:has(#lp-tab-vue:checked) [data-tab='vue'],
  .tabs:has(#lp-tab-headless:checked) [data-tab='headless'],
  .tabs:has(#lp-tab-figma:checked) [data-tab='figma'] {
    display: block;
  }
}

@media (max-width: 639px) {
  .tabs__bar {
    width: 100%;
  }

  .tabs__label {
    flex: 1;
    min-height: 44px;
    display: grid;
    place-items: center;
  }
}
</style>
