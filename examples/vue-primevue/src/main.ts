import type { FormDefinition } from '@formhaus/core';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';
import { listenToPlayground, type Theme } from './playground';
import './styles.css';

let app: VueApp | undefined;

function mount(definition?: FormDefinition) {
  app?.unmount();
  app = createApp(App, definition ? { definition } : {});
  app.use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } });
  app.mount('#app');
}

const system = matchMedia('(prefers-color-scheme: dark)');
let followSystem = true;

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('app-dark', theme === 'dark');
}

setTheme(system.matches ? 'dark' : 'light');
system.addEventListener('change', (event) => followSystem && setTheme(event.matches ? 'dark' : 'light'));

mount();
listenToPlayground(mount, (theme) => {
  followSystem = false;
  setTheme(theme);
});
