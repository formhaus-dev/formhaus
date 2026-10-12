import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PlaygroundSandpack from '../components/playground/PlaygroundSandpack.vue';
import GithubStar from '../components/GithubStar.vue';
import DocsDrawerMenu from '../components/DocsDrawerMenu.vue';
import './brand.css';
import './docs-menu.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(GithubStar),
      'nav-screen-content-after': () => h(DocsDrawerMenu),
    }),
  enhanceApp({ app }) {
    app.component('PlaygroundSection', PlaygroundSandpack);
  },
} satisfies Theme;
