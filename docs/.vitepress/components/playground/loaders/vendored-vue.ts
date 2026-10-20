import cloudJs from '../vendored-vue/cloud.js.txt?raw';
import i18nJs from '../vendored-vue/i18n.js.txt?raw';
import indexJs from '../vendored-vue/index.js.txt?raw';

const root = '/node_modules/@formhaus/vue';

export const vendoredVueFiles: Record<string, string> = {
  [`${root}/package.json`]: JSON.stringify({
    name: '@formhaus/vue',
    version: '1.0.0-rc.0',
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    exports: { '.': './dist/index.js', './cloud': './dist/cloud.js', './i18n': './dist/i18n.js' },
  }),
  [`${root}/dist/index.js`]: indexJs,
  [`${root}/dist/cloud.js`]: cloudJs,
  [`${root}/dist/i18n.js`]: i18nJs,
};

export const vendoredVueDeps: Record<string, string> = { '@formhaus/core': '1.0.0-rc.0' };
