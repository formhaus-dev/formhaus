import { defineAsyncComponent } from 'vue';
import { createTheme } from '@formhaus/site-theme';

export default createTheme(({ app }) => {
  app.component(
    'PlaygroundSection',
    defineAsyncComponent(() => import('../components/playground/PlaygroundSandpack.vue')),
  );
});
