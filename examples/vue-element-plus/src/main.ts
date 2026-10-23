import type { FormDefinition } from '@formhaus/core';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';
import { listenToPlayground, type Theme } from './playground';
import './styles.css';

let app: VueApp | undefined;

function mount(definition?: FormDefinition) {
  app?.unmount();
  app = createApp(App, definition ? { definition } : {});
  app.mount('#app');
}

const system = matchMedia('(prefers-color-scheme: dark)');
let followSystem = true;

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

setTheme(system.matches ? 'dark' : 'light');
system.addEventListener('change', (event) => followSystem && setTheme(event.matches ? 'dark' : 'light'));

mount();
listenToPlayground(mount, (theme) => {
  followSystem = false;
  setTheme(theme);
});
