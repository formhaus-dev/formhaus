import type { FormDefinition } from '@formhaus/core';
import { createApp, type App as VueApp } from 'vue';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'vuetify/styles';
import App from './App.vue';
import { listenToPlayground } from './playground';

const vuetify = createVuetify({ icons: { defaultSet: 'mdi', aliases, sets: { mdi } } });
let app: VueApp | undefined;

function mount(definition?: FormDefinition) {
  app?.unmount();
  app = createApp(App, definition ? { definition } : {});
  app.use(vuetify);
  app.mount('#app');
}

mount();
listenToPlayground({
  definition: mount,
  theme: (theme) => vuetify.theme.change(theme),
});
