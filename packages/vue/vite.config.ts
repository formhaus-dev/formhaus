import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const sfcDefault = { exported: 'export default _sfc_main;', binding: 'export { _sfc_main as default };' };
const namedComponent = /export default (\/\*@__PURE__\*\/ _defineComponent\(\{)(\s*)__name: "(\w+)",/;

const developmentNames: Plugin = {
  name: 'formhaus-development-names',
  enforce: 'post',
  transform(code, id) {
    if (id.endsWith('.vue')) return { code: code.replace(sfcDefault.exported, sfcDefault.binding), map: null };
    const match = id.includes('.vue?vue&type=script') && code.match(namedComponent);
    if (!match) return null;
    const [declaration, call, space, name] = match;
    const component = code.replace(declaration, `const _sfc_main = ${call}${space.replace(/[^\n]/g, '')}`);
    const development = `try {\n  if (process.env.NODE_ENV !== 'production') _sfc_main.__name = '${name}';\n} catch {}\n`;
    return { code: `${component}${development}${sfcDefault.binding}\n`, map: null };
  },
};

export default defineConfig({
  plugins: [
    vue(),
    developmentNames,
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      bundleTypes: true,
      tsconfigPath: './tsconfig.json',
      afterDiagnostic(diagnostics) {
        if (diagnostics.length) throw new Error('@formhaus/vue has type errors');
      },
    }),
  ],
  oxc: { target: 'es2020' },
  build: {
    target: 'es2020',
    sourcemap: true,
    minify: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cloud: resolve(__dirname, 'src/cloud/index.ts'),
        controls: resolve(__dirname, 'src/controls/index.ts'),
        i18n: resolve(__dirname, 'src/i18n/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      output: { sourcemapExcludeSources: true },
      external: [
        'vue',
        '@formhaus/core',
        '@formhaus/core/cloud',
        '@formhaus/core/internal',
        '@formhaus/core/internal/cloud',
        '@formhaus/core/fields',
        '@formhaus/core/controls',
        '@formhaus/core/i18n',
        '@formhaus/vue',
      ],
    },
  },
});
