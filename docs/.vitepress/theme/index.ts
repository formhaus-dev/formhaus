import { createTheme } from '@formhaus/site-theme';
import { defineAsyncComponent } from 'vue';

export default createTheme(({ app }) => {
  app.component(
    'RecipePreview',
    defineAsyncComponent(() => import('../components/recipes/RecipePreview.vue')),
  );
});
