<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { VPImage, useSidebar } from 'vitepress/theme';
import { footerColumns, footerRepo } from './footer';
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
          <p class="fh-footer__tagline">The simple way to collect responses.</p>
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
      <div class="fh-footer__bottom">
        <p class="fh-footer__copyright">© 2026 Formhaus</p>
        <a
          class="fh-footer__github"
          :href="footerRepo"
          aria-label="Formhaus on GitHub"
          target="_blank"
          rel="noopener"
          data-umami-event="outbound-click"
          data-umami-event-dest="github"
          data-umami-event-location="footer"
        >
          <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </a>
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
  .fh-footer__link:hover,
  .fh-footer__github:hover {
    color: var(--vp-c-brand-1);
  }
}

.fh-footer__link:focus-visible,
.fh-footer__brand:focus-visible,
.fh-footer__github:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

.fh-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fh-site-space-4);
  margin-top: var(--fh-site-space-10);
  padding-top: var(--fh-site-space-3);
  border-top: 1px solid var(--vp-c-divider);
}

.fh-footer__copyright {
  margin: 0;
  font-size: var(--fh-site-font-size-xs);
  line-height: 20px;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.fh-footer__github {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: calc(-1 * var(--fh-site-space-3));
  color: var(--vp-c-text-2);
  transition: color 0.25s;
}

@media (min-width: 640px) {
  .fh-footer__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fh-footer__identity {
    grid-column: auto;
  }

  .fh-footer__link {
    min-height: 32px;
  }

  .fh-footer__bottom {
    margin-top: var(--fh-site-space-12);
  }
}

@media (min-width: 1440px) {
  .fh-footer--sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
    padding-right: calc((100vw - var(--vp-layout-max-width)) / 2);
  }
}
</style>
