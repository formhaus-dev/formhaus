import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve('.');
const work = mkdtempSync(join(tmpdir(), 'formhaus-consumer-'));
const modules = join(work, 'node_modules');

function install(name) {
  const target = join(modules, '@formhaus', name);
  mkdirSync(target, { recursive: true });
  execFileSync('pnpm', ['pack', '--pack-destination', work], { cwd: join(root, 'packages', name), stdio: 'ignore' });
  const tarball = readdirSync(work).find((file) => file.startsWith(`formhaus-${name}-`) && file.endsWith('.tgz'));
  execFileSync('tar', ['-xzf', join(work, tarball), '-C', target, '--strip-components=1']);
  rmSync(join(work, tarball));
}

function link(name, from) {
  const target = join(modules, name);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(realpathSync(join(root, 'packages', from, 'node_modules', name)), target, 'dir');
}

const files = {
  'package.json': JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
  'src/react.tsx': `import { FormRenderer, HeadlessFormRenderer, TextField, type FieldComponentMap } from '@formhaus/react';
import { FormhausForm, CloudError } from '@formhaus/react/cloud';
import { useLocalizedForm } from '@formhaus/react/i18n';
import { localize, type Overlay } from '@formhaus/core/i18n';
import { applyFix, fixAll, suggestFixes, type DefinitionFix } from '@formhaus/core/fix';
import type { FormDefinition } from '@formhaus/core';

const definition: FormDefinition = { id: 'contact', title: 'Contact', fields: [{ key: 'name', type: 'text', label: 'Name' }], submit: { label: 'Send' } };
export const views = [
  <FormRenderer definition={definition} onSubmit={async () => {}} />,
  <HeadlessFormRenderer definition={definition} onSubmit={async () => {}} />,
  <FormhausForm id="abc" />,
];
export const extras = [TextField, CloudError];
export const components: FieldComponentMap = {
  text: ({ value, onChange }) => <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />,
  rating: ({ value, onChange }) => <button type="button" onClick={() => onChange(Number(value) + 1)} />,
  section: ({ title, children }) => <fieldset aria-label={title}>{children}</fieldset>,
  group: ({ label, add }) => <button type="button" onClick={add}>{label}</button>,
  groupItem: ({ title, children }) => <div title={title}>{children}</div>,
  confirmDialog: ({ open, confirm }) => (open ? <button type="button" onClick={confirm} /> : null),
};
const overlay: Overlay = { title: 'Kontakt' };
export const localized = localize(definition, { overlay, lang: 'de' });
const fixes: DefinitionFix[] = suggestFixes(definition).flatMap((issue) => issue.fixes ?? []);
export const fixed = [fixes.reduce((current, fix) => applyFix(current, fix.patch), definition), fixAll(definition).definition];
export function Localized() {
  const form = useLocalizedForm(definition, { translate: (key, params, fallback) => fallback, prefix: false });
  return <FormRenderer {...form} onSubmit={() => {}} />;
}
`,
  'src/vue.ts': `import { createApp, h } from 'vue';
import * as Formhaus from '@formhaus/vue';
import { FormhausForm, CloudError } from '@formhaus/vue/cloud';
import { useLocalizedForm } from '@formhaus/vue/i18n';
import type { FormDefinition } from '@formhaus/core';

const definition: FormDefinition = { id: 'contact', title: 'Contact', fields: [{ key: 'name', type: 'text', label: 'Name' }], submit: { label: 'Send' } };
export const components: Formhaus.FieldComponentMap = {
  text: (props: { modelValue?: unknown }) => h('input', { value: String(props.modelValue ?? '') }),
  rating: Formhaus.TextField,
  section: (_props, { slots }) => h('fieldset', slots.default?.()),
};
export const app = createApp({ render: () => [h(Formhaus.FormRenderer, { definition }), h(FormhausForm, { id: 'abc' })] })
  .component('FormRenderer', Formhaus.FormRenderer)
  .component('TextField', Formhaus.TextField)
  .component('FormhausForm', FormhausForm);
export const extras = [Formhaus, CloudError];
export const localized = useLocalizedForm(() => definition, () => ({ overlay: { title: 'Kontakt' } }));
`,
};

const resolutions = { bundler: 'ESNext', node16: 'Node16' };
for (const [resolution, module] of Object.entries(resolutions)) {
  files[`tsconfig.${resolution}.json`] = JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module,
      moduleResolution: resolution,
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM'],
      types: [],
    },
    include: ['src'],
  });
}

let failed = false;
try {
  for (const name of ['core', 'react', 'vue']) install(name);
  link('vue', 'vue');
  link('react', 'react');
  link('@types/react', 'react');
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(work, path)), { recursive: true });
    writeFileSync(join(work, path), source);
  }
  const tsc = join(root, 'packages/react/node_modules/typescript/bin/tsc');
  for (const resolution of Object.keys(resolutions)) {
    try {
      execFileSync(process.execPath, [tsc, '-p', `tsconfig.${resolution}.json`], { cwd: work, encoding: 'utf8' });
      console.log(`consumer types ok (moduleResolution ${resolution})`);
    } catch (error) {
      failed = true;
      console.error(`consumer types failed (moduleResolution ${resolution}):\n${error.stdout}${error.stderr}`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failed) process.exit(1);
