import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { version as esbuildVersion } from 'esbuild';
import { formhausBlocks, table, writeBlocks } from './size/docs.mjs';
import { bundleSize, kb, REACT_EXTERNAL, VUE_EXTERNAL } from './size/measure.mjs';

const VERSIONS = {
  'react-hook-form': '7.90.0',
  formik: '2.4.9',
  yup: '1.7.1',
  '@formkit/vue': '2.1.2',
  '@rjsf/core': '6.11.0',
  '@rjsf/utils': '6.11.0',
  '@rjsf/validator-ajv8': '6.11.0',
  'survey-core': '3.2.1',
  'survey-react-ui': '3.2.1',
  '@jsonforms/core': '3.8.0',
  '@jsonforms/react': '3.8.0',
  '@jsonforms/vanilla-renderers': '3.8.0',
  '@tanstack/react-form': '1.33.5',
};

const v = (name) => VERSIONS[name];

const LIBRARIES = [
  {
    name: `react-hook-form ${v('react-hook-form')}`,
    quote: 'react-hook-form',
    quoteText: (size) => `${size} for ${v('react-hook-form')}`,
    external: REACT_EXTERNAL,
    entry: `export { useForm } from 'react-hook-form';`,
    features: ['Yes', 'No', 'No', 'With a schema resolver shared with the server', 'No'],
  },
  {
    name: `@tanstack/react-form ${v('@tanstack/react-form')}`,
    external: REACT_EXTERNAL,
    entry: `export { useForm } from '@tanstack/react-form';`,
    features: [
      'Yes',
      'No',
      'No',
      'A Standard Schema validator shared with the server, or `createServerValidate` in the framework adapters',
      'No',
    ],
  },
  {
    name: `formik ${v('formik')} + yup ${v('yup')}`,
    external: REACT_EXTERNAL,
    entry: `export { useFormik } from 'formik';\nexport { object, string } from 'yup';`,
    features: ['Yes', 'No', 'No', 'The Yup schema runs on the server', 'No'],
  },
  {
    name: `@formkit/vue ${v('@formkit/vue')}`,
    external: VUE_EXTERNAL,
    entry: `export { plugin, defaultConfig, FormKit } from '@formkit/vue';`,
    features: ['Yes', 'Yes', 'Plugin in `@formkit/addons`, not counted', 'No', 'FormKit schema'],
  },
  {
    name: `JSON Forms ${v('@jsonforms/core')} (\`@jsonforms/core\` + \`@jsonforms/react\` + \`@jsonforms/vanilla-renderers\`)`,
    quote: 'jsonforms',
    quoteText: (size) =>
      `${size} for \`@jsonforms/core\` + \`@jsonforms/react\` + \`@jsonforms/vanilla-renderers\` ${v('@jsonforms/core')}`,
    external: REACT_EXTERNAL,
    entry: `export { JsonForms } from '@jsonforms/react';\nexport { vanillaRenderers } from '@jsonforms/vanilla-renderers';`,
    features: [
      'Yes',
      'Yes',
      'Categorization layout, shown as a category list in the vanilla renderers',
      'AJV runs the JSON Schema on the server',
      'JSON Schema and UI schema',
    ],
  },
  {
    name: `react-jsonschema-form ${v('@rjsf/core')} (\`@rjsf/core\` + \`@rjsf/validator-ajv8\`)`,
    quote: 'rjsf',
    quoteText: (size) => `${size} for \`@rjsf/core\` + \`@rjsf/validator-ajv8\` ${v('@rjsf/core')}`,
    external: REACT_EXTERNAL,
    entry: `export { default as Form } from '@rjsf/core';\nexport { default as validator } from '@rjsf/validator-ajv8';`,
    features: ['Yes', 'Yes', 'No', 'AJV runs the JSON Schema on the server', 'JSON Schema and UI schema'],
  },
  {
    name: `SurveyJS ${v('survey-core')} (\`survey-core\` + \`survey-react-ui\`)`,
    quote: 'surveyjs',
    quoteText: (size) => `${size} for \`survey-core\` + \`survey-react-ui\` ${v('survey-core')}`,
    external: REACT_EXTERNAL,
    entry: `export { Model } from 'survey-core';\nexport { Survey } from 'survey-react-ui';`,
    features: ['Yes', 'Yes', 'Yes', '`onServerValidateQuestions` calls your server check', 'Yes'],
  },
];

const { sizes, blocks } = await formhausBlocks();

const dir = mkdtempSync(join(tmpdir(), 'formhaus-bundle-compare-'));
try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true }));
  const specs = Object.entries(VERSIONS).map(([name, version]) => `${name}@${version}`);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--legacy-peer-deps', '--min-release-age=0', ...specs], {
    cwd: dir,
    stdio: 'inherit',
  });
  for (const library of LIBRARIES) library.size = await bundleSize(library.entry, { external: library.external, resolveDir: dir });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const date = new Date().toISOString().slice(0, 10);
const installed = Object.entries(VERSIONS)
  .map(([name, version]) => `\`${name}@${version}\``)
  .join(', ');
const head = ['Library', 'gzip', 'State and validation', 'Rendering', 'Multi-step', 'Same validation on the server', 'JSON definitions'];
const rows = [...LIBRARIES].sort((a, b) => a.size - b.size).map((library) => [library.name, kb(library.size), ...library.features]);
const quotes = LIBRARIES.filter((library) => library.quote).map((library) => [library.quote, library.quoteText(kb(library.size))]);
const competitors = {
  libraries: `${table(head, rows)}Installed from npm on ${date}: ${installed}. Bundled with esbuild ${esbuildVersion} as in [Method](#method).\n\n`,
  ...Object.fromEntries(quotes),
};

writeBlocks({ ...blocks, ...competitors });

for (const library of LIBRARIES) console.log(`${library.name}: ${library.size} B (${kb(library.size)}) gzipped`);
for (const [name, size] of Object.entries(sizes)) console.log(`@formhaus/${name}: ${size} B (${kb(size)}) gzipped`);
