import { createTheme } from '@formhaus/site-theme';
import RecipePreview from '../components/recipes/RecipePreview.vue';

export default createTheme(({ app }) => {
  app.component('RecipePreview', RecipePreview);
});
