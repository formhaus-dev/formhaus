import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import type { EnhanceAppContext, Theme } from 'vitepress';
import NavCta from './NavCta.vue';
import SiteSearch from './SiteSearch.vue';
import SiteNav from './SiteNav.vue';
import PromoBar from './PromoBar.vue';
import SiteFooter from './SiteFooter.vue';
import './promo.css';
import DocsDrawerMenu from './DocsDrawerMenu.vue';
import { ownerOf } from './routes.js';
import './brand.css';
import './docs-menu.css';

import { startAnalytics } from './analytics';

export { track } from './analytics';
export { promoHead } from './promo';

function stayInOwnBuild({ router }: EnhanceAppContext) {
  if (typeof window === 'undefined') return;
  let initial = true;
  router.onBeforePageLoad = (href) => {
    const url = new URL(href, window.location.href);
    if (initial || ownerOf(url.pathname) === ownerOf(router.route.path)) {
      initial = false;
      return;
    }
    window.location.replace(url.href);
    return false;
  };
}

export function createTheme(enhance?: (context: EnhanceAppContext) => void): Theme {
  return {
    extends: DefaultTheme,
    Layout: () =>
      h(DefaultTheme.Layout, null, {
        'layout-top': () => h(PromoBar),
        'nav-bar-content-before': () => [h(SiteNav), h(SiteSearch)],
        'nav-bar-content-after': () => h(NavCta),
        'nav-screen-content-before': () => h(SiteNav, { mobile: true }),
        'nav-screen-content-after': () => h(DocsDrawerMenu),
        'layout-bottom': () => h(SiteFooter),
      }),
    enhanceApp(context) {
      stayInOwnBuild(context);
      startAnalytics();
      enhance?.(context);
    },
  };
}
