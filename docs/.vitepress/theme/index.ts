import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PlaygroundSandpack from '../components/playground/PlaygroundSandpack.vue';
import './brand.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundSection', PlaygroundSandpack);
  },
} satisfies Theme;
