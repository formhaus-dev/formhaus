<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { VPImage, useSidebar } from 'vitepress/theme';
import { footerColumns } from './footer';
import { useGatedLinks } from './gated';

const { frontmatter } = useData();
const { hasSidebar } = useSidebar();
const landing = computed(() =>
  String(frontmatter.value.pageClass || '')
    .split(/\s+/)
    .includes('lp-page'),
);
const gated = useGatedLinks();
const columns = computed(() => footerColumns.map((column) => ({ ...column, links: gated(column.links) })));
const logo = { light: '/brand/logo-full.svg', dark: '/brand/logo-full-dark.svg', alt: 'Formhaus' };
</script>

<template>
  <footer class="fh-footer" :class="{ 'fh-footer--sidebar': hasSidebar, 'fh-footer--landing': landing }">
    <div class="fh-footer__container">
      <div class="fh-footer__grid">
        <div class="fh-footer__identity">
          <a class="fh-footer__brand" href="/" aria-label="Formhaus home">
            <VPImage :image="logo" />
          </a>
          <p class="fh-footer__tagline">Write your forms once, render everywhere.</p>
        </div>
        <nav v-for="column in columns" :key="column.title" class="fh-footer__column" :aria-labelledby="`fh-footer-${column.id}`">
          <h2 :id="`fh-footer-${column.id}`" class="fh-footer__title">{{ column.title }}</h2>
          <ul class="fh-footer__links">
            <li v-for="link in column.links" :key="link.text">
              <a
                class="fh-footer__link"
                :href="link.href"
                v-bind="link.dest ? { target: '_blank', rel: 'noopener', 'data-umami-event': 'outbound-click', 'data-umami-event-dest': link.dest, 'data-umami-event-location': 'footer' } : {}"
              >{{ link.text }}</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.fh-footer {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.fh-footer__container {
  box-sizing: content-box;
  max-width: 1152px;
  margin: 0 auto;
  padding: var(--fh-site-space-12) var(--fh-site-space-6) var(--fh-site-space-4);
}

.fh-footer--landing .fh-footer__container {
  padding-inline: var(--fh-site-space-4);
}

.fh-footer__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--fh-site-space-8) var(--fh-site-space-6);
}

.fh-footer__identity {
  grid-column: 1 / -1;
}

.fh-footer__brand {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: calc(-1 * var(--fh-site-space-2-5));
}

.fh-footer__brand :deep(.VPImage) {
  height: 24px;
  width: auto;
}

.fh-footer__tagline {
  margin: var(--fh-site-space-1) 0 0;
  font-size: var(--fh-site-font-size-sm);
  line-height: 20px;
  color: var(--vp-c-text-2);
}

.fh-footer__title {
  margin: 0 0 var(--fh-site-space-2);
  font-size: var(--fh-site-font-size-xs);
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0;
  color: var(--vp-c-text-2);
}

.fh-footer__links {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fh-footer__link {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--fh-site-font-size-sm);
  font-weight: 500;
  line-height: 20px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.25s;
}

@media (hover: hover) and (pointer: fine) {
  .fh-footer__link:hover {
    color: var(--vp-c-brand-1);
  }
}

.fh-footer__link:focus-visible,
.fh-footer__brand:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

@media (min-width: 768px) {
  .fh-footer__container,
  .fh-footer--landing .fh-footer__container {
    padding-inline: var(--fh-site-space-8);
  }
}

@media (min-width: 960px) {
  .fh-footer--sidebar {
    padding-left: var(--vp-sidebar-width);
  }

  .fh-footer__container {
    padding-top: var(--fh-site-space-16);
  }

  .fh-footer__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fh-footer__identity {
    grid-column: auto;
  }

  .fh-footer__link {
    min-height: 32px;
  }

}

@media (min-width: 1440px) {
  .fh-footer--sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
    padding-right: calc((100vw - var(--vp-layout-max-width)) / 2);
  }
}
</style>
