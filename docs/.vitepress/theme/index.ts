import PlaygroundSandpack from '../components/playground/PlaygroundSandpack.vue';
import { createTheme } from '@formhaus/site-theme';

export default createTheme(({ app }) => {
  app.component('PlaygroundSection', PlaygroundSandpack);
});
