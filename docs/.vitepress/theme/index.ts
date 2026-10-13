import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PlaygroundSandpack from '../components/playground/PlaygroundSandpack.vue';
import GithubStar from '../components/GithubStar.vue';
import NavCta from '../components/NavCta.vue';
import LpNav from '../components/LpNav.vue';
import './landing-nav.css';
import DocsDrawerMenu from '../components/DocsDrawerMenu.vue';
import './brand.css';
import './docs-menu.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(LpNav),
      'nav-bar-content-after': () => [h(GithubStar), h(NavCta)],
      'nav-screen-content-before': () => [h(NavCta, { mobile: true }), h(LpNav, { mobile: true })],
      'nav-screen-content-after': () => h(DocsDrawerMenu),
    }),
  enhanceApp({ app }) {
    app.component('PlaygroundSection', PlaygroundSandpack);
  },
} satisfies Theme;
