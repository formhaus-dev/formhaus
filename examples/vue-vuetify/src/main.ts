import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';
import App from './App.vue';

const vuetify = createVuetify({ components, directives, icons: { defaultSet: 'mdi', aliases, sets: { mdi } } });
const app = createApp(App);
app.use(vuetify);
app.mount('#app');
