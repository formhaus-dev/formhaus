import type { FormDefinition } from '@formhaus/core';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';
import { listenToPlayground, type Theme } from './playground';
import './styles.css';
import './fields.css';

let app: VueApp | undefined;

function mount(definition?: FormDefinition) {
  app?.unmount();
  app = createApp(App, definition ? { definition } : {});
  app.mount('#app');
}

mount();
listenToPlayground({
  definition: mount,
  theme: (theme: Theme) => document.documentElement.classList.toggle('dark', theme === 'dark'),
});
