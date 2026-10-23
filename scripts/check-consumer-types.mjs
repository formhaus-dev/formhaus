import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  'src/react.tsx': `import { createRef } from 'react';
import { FormRenderer, HeadlessFormRenderer, TextField, type FieldComponentMap, type FormRendererHandle } from '@formhaus/react';
import { FormhausForm, CloudError } from '@formhaus/react/cloud';
import { useLocalizedForm } from '@formhaus/react/i18n';
import { localize, type Overlay } from '@formhaus/core/i18n';
import { applyFix, fixAll, suggestFixes, type DefinitionFix } from '@formhaus/core/fix';
import type { FormDefinition } from '@formhaus/core';
import { questionTimer } from './question-timing.js';
import { onValidate } from './schema-zod.js';

const definition: FormDefinition = { id: 'contact', title: 'Contact', fields: [{ key: 'name', type: 'text', label: 'Name' }, { key: 'utm', type: 'hidden' }], submit: { label: 'Send' } };
export const handle = createRef<FormRendererHandle>();
export const views = [
  <FormRenderer definition={definition} onSubmit={async () => {}} />,
  <HeadlessFormRenderer definition={definition} onSubmit={async () => {}} />,
  <FormRenderer ref={handle} definition={definition} onSubmit={async () => {}} />,
  <FormhausForm id="abc" />,
  <FormRenderer definition={definition} onSubmit={async () => {}} onValidate={onValidate} />,
  <FormRenderer definition={definition} onSubmit={async () => {}} onFormEvent={questionTimer((time) => console.log(time.stepId, time.fieldKey, time.ms)).onEvent} />,
];
export const extras = [TextField, CloudError];
export const components: FieldComponentMap = {
  text: ({ field, value, onChange }) => <input aria-label={field.label.trim()} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />,
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
  'src/vue-props.ts': `import { defineComponent, h, type ExtractPublicPropTypes } from 'vue';
import * as Formhaus from '@formhaus/vue';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Props<T> = ExtractPublicPropTypes<T>;
export const same: [
  Same<Props<typeof Formhaus.fieldComponentProps>, Formhaus.FieldComponentProps>,
  Same<Props<typeof Formhaus.sectionComponentProps>, Formhaus.SectionComponentProps>,
  Same<Props<typeof Formhaus.groupComponentProps>, Formhaus.GroupComponentProps>,
  Same<Props<typeof Formhaus.groupItemComponentProps>, Formhaus.GroupItemComponentProps>,
  Same<Props<typeof Formhaus.confirmDialogComponentProps>, Formhaus.ConfirmDialogComponentProps>,
  Same<Props<typeof Formhaus.formActionsProps>, Formhaus.FormActionsProps>,
  Same<Props<typeof Formhaus.formStepProgressProps>, Formhaus.FormStepProgressProps>,
  Same<keyof Props<typeof Formhaus.fieldComponentProps>, keyof Formhaus.FieldComponentProps>,
  Same<keyof Props<typeof Formhaus.sectionComponentProps>, keyof Formhaus.SectionComponentProps>,
  Same<keyof Props<typeof Formhaus.groupComponentProps>, keyof Formhaus.GroupComponentProps>,
  Same<keyof Props<typeof Formhaus.groupItemComponentProps>, keyof Formhaus.GroupItemComponentProps>,
  Same<keyof Props<typeof Formhaus.confirmDialogComponentProps>, keyof Formhaus.ConfirmDialogComponentProps>,
  Same<keyof Props<typeof Formhaus.formActionsProps>, keyof Formhaus.FormActionsProps>,
  Same<keyof Props<typeof Formhaus.formStepProgressProps>, keyof Formhaus.FormStepProgressProps>,
] = [true, true, true, true, true, true, true, true, true, true, true, true, true, true];
export const TypedField = defineComponent({
  props: Formhaus.fieldComponentProps,
  emits: Formhaus.fieldComponentEmits,
  setup(props, { emit }) {
    const key: string = props.field.key;
    const disabled: boolean = props.disabled;
    return () => h('input', { id: props.id ?? key, disabled, onInput: () => emit('update:modelValue', props.modelValue), onBlur: () => emit('blur') });
  },
});
export const TypedActions = defineComponent({
  props: Formhaus.formActionsProps,
  emits: Formhaus.formActionsEmits,
  setup(props, { emit }) {
    const back: Formhaus.FormActionsProps['backAction'] = props.backAction;
    return () => h('button', { 'data-variant': back ? back.variant : undefined, onClick: () => emit('back') }, props.backLabel);
  },
});
export const components: Formhaus.FieldComponentMap = { 'x-field': TypedField };
export const handles: Formhaus.FormRendererHandle[] = [
  {} as InstanceType<typeof Formhaus.FormRenderer>,
  {} as InstanceType<typeof Formhaus.HeadlessFormRenderer>,
];
`,
  'src/vue.ts': `import { createApp, h } from 'vue';
import * as Formhaus from '@formhaus/vue';
import { FormhausForm, CloudError } from '@formhaus/vue/cloud';
import { useLocalizedForm } from '@formhaus/vue/i18n';
import type { FormDefinition } from '@formhaus/core';
import { onValidate } from './on-validate.js';
import ru from '@formhaus/core/locales/ru';

const definition: FormDefinition = { id: 'contact', title: 'Contact', fields: [{ key: 'name', type: 'text', label: 'Name' }], submit: { label: 'Send' } };
export const components: Formhaus.FieldComponentMap = {
  text: (props: { modelValue?: unknown }) => h('input', { value: String(props.modelValue ?? '') }),
  rating: Formhaus.TextField,
  section: (_props, { slots }) => h('fieldset', slots.default?.()),
  group: Formhaus.TextField,
  groupItem: (_props, { slots }) => h('div', slots.default?.()),
  confirmDialog: () => h('dialog'),
};
type Named<T> = keyof { [K in keyof T as string extends K ? never : K]: T[K] };
export const nodeKeys: Named<Formhaus.FieldComponentMap>[] = ['section', 'group', 'groupItem', 'confirmDialog'];
export const app = createApp({ render: () => [h(Formhaus.FormRenderer, { definition, onValidate, locale: [ru] }), h(FormhausForm, { id: 'abc' })] })
  .component('FormRenderer', Formhaus.FormRenderer)
  .component('TextField', Formhaus.TextField)
  .component('FormhausForm', FormhausForm);
export const extras = [Formhaus, CloudError];
export const localized = useLocalizedForm(() => definition, () => ({ overlay: { title: 'Kontakt' } }));
`,
};

files['src/question-timing.ts'] = readFileSync(join(root, 'docs/recipes/snippets/question-timing.ts'), 'utf8');
files['src/ssr-cloud-page.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/ssr-cloud-page.tsx'), 'utf8');
files['src/use-form-engine.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/use-form-engine.tsx'), 'utf8');
files['src/custom-layout.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/custom-layout.tsx'), 'utf8');
files['src/steps-in-url.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/steps-in-url.tsx'), 'utf8');
files['src/steps-in-url-page.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/steps-in-url-page.tsx'), 'utf8');
for (const name of ['on-validate', 'schema-zod', 'schema-valibot', 'schema-arktype', 'schema-server-check', 'locale-catalogs'])
  files[`src/${name}.ts`] = readFileSync(join(root, `docs/recipes/snippets/${name}.ts`), 'utf8');
files['src/locale-catalogs-page.tsx'] = readFileSync(join(root, 'docs/recipes/snippets/locale-catalogs-page.tsx'), 'utf8');

const arktype = 'src/schema-arktype.ts';
const checks = {
  bundler: { module: 'ESNext', exclude: [arktype] },
  node16: { module: 'Node16', exclude: ['src/steps-in-url-page.tsx', arktype] },
  'bundler, ArkType without its lib check': { module: 'ESNext', include: [arktype], skipLibCheck: true },
};
const configs = Object.keys(checks).map((_, index) => `tsconfig.${index}.json`);
Object.values(checks).forEach(({ module, include = ['src'], exclude = [], skipLibCheck = false }, index) => {
  files[configs[index]] = JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module,
      moduleResolution: module === 'ESNext' ? 'bundler' : 'node16',
      strict: true,
      skipLibCheck,
      noEmit: true,
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM'],
      types: [],
    },
    include,
    exclude,
  });
});

let failed = false;
try {
  for (const name of ['core', 'react', 'vue']) install(name);
  link('vue', 'vue');
  link('react', 'react');
  link('@types/react', 'react');
  for (const name of ['zod', 'valibot', 'arktype']) link(name, 'core');
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(work, path)), { recursive: true });
    writeFileSync(join(work, path), source);
  }
  const tsc = join(root, 'packages/react/node_modules/typescript/bin/tsc');
  Object.keys(checks).forEach((check, index) => {
    try {
      execFileSync(process.execPath, [tsc, '-p', configs[index]], { cwd: work, encoding: 'utf8' });
      console.log(`consumer types ok (moduleResolution ${check})`);
    } catch (error) {
      failed = true;
      console.error(`consumer types failed (moduleResolution ${check}):\n${error.stdout}${error.stderr}`);
    }
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failed) process.exit(1);
