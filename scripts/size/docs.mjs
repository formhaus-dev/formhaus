import { readFileSync, writeFileSync } from 'node:fs';
import { kb, measureEntries } from './measure.mjs';

const DOC_FILES = [
  'docs/guide/bundle-size.md',
  'docs/compare/index.md',
  'docs/compare/json-forms.md',
  'docs/compare/react-hook-form.md',
  'docs/compare/react-jsonschema-form.md',
  'docs/compare/surveyjs.md',
];

const MARKER = /(<!-- size:([\w-]+):start -->)([\s\S]*?)(<!-- size:\2:end -->)/g;
const VALUE = /(\d+(?:\.\d+)?) KB/g;
const TOLERANCE_KB = 0.5;

const APP_LABELS = {
  core: 'Every export of `@formhaus/core`',
  'core + react': 'Every export of `@formhaus/core` and `@formhaus/react`',
  'core + vue': 'Every export of `@formhaus/core` and `@formhaus/vue`',
  'core FormEngine': '`FormEngine` from `@formhaus/core`',
  'core + react useFormEngine': '`useFormEngine` from `@formhaus/react`, with core',
  'core + vue useFormEngine': '`useFormEngine` from `@formhaus/vue`, with core',
  'core + react FormRenderer': '`FormRenderer` from `@formhaus/react`, with core',
  'core + vue FormRenderer': '`FormRenderer` from `@formhaus/vue`, with core',
  'core FormEngine (trusted)': '`FormEngine` from `@formhaus/core`, with `FORMHAUS_TRUSTED`',
  'core + react FormRenderer (trusted)': '`FormRenderer` from `@formhaus/react`, with core and `FORMHAUS_TRUSTED`',
  'core + vue FormRenderer (trusted)': '`FormRenderer` from `@formhaus/vue`, with core and `FORMHAUS_TRUSTED`',
};

const TRUSTED = [
  ['`FormEngine` from `@formhaus/core`', 'core FormEngine'],
  ['`FormRenderer` from `@formhaus/react`, with core', 'core + react FormRenderer'],
  ['`FormRenderer` from `@formhaus/vue`, with core', 'core + vue FormRenderer'],
];

const PATHS = [
  ['FormEngine', 'All markup, in any framework. The engine does state, conditions, validation, steps and a basic structure check'],
  [
    'useFormEngine',
    'All markup. The hook gives the visible fields of the step, values, errors, the current step, `setValue`, `next`, `back` and `submit`',
  ],
  [
    'HeadlessFormRenderer',
    'A component for each field type, actions and progress. The renderer does steps, field order, conditions, focus and the error summary',
  ],
  ['FormRenderer', 'Nothing. Built-in fields, actions and progress; replace some types through `components`'],
];

const ADDONS = [
  ['`checkDefinition()` with warnings and hints, for an editor, CI or AI generation', 'core FormEngine + checkDefinition'],
  ['`@formhaus/core/cloud`', 'core FormEngine + /cloud'],
  ['`@formhaus/core/i18n`', 'core FormEngine + /i18n'],
  ['`@formhaus/core/fix`', 'core FormEngine + /fix'],
  ['`@formhaus/core/research`', 'core FormEngine + /research'],
  ['`@formhaus/core/fields`', 'core FormEngine + /fields'],
  ['`@formhaus/core/schema`', 'core FormEngine + /schema'],
];

const SERVER = '`validateSubmission()`';

export const table = (head, rows) =>
  `\n\n${[`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n')}\n\n`;

const pathSize = (sizes, entry, pkg) => kb(sizes[entry === 'FormEngine' ? 'core FormEngine' : `core + ${pkg} ${entry}`]);

export async function formhausBlocks() {
  const sizes = await measureEntries();
  const engine = sizes['core FormEngine'];
  const apps = Object.entries(APP_LABELS).map(([name, label]) => [label, kb(sizes[name])]);
  return {
    sizes,
    blocks: {
      apps: table(['App imports', 'Measured'], apps),
      paths: table(
        ['Entry', 'You write', 'React', 'Vue'],
        PATHS.map(([entry, write]) => [`\`${entry}\``, write, pathSize(sizes, entry, 'react'), pathSize(sizes, entry, 'vue')]),
      ),
      addons: table(
        ['Import', 'Adds'],
        [...ADDONS.map(([label, name]) => [label, kb(sizes[name] - engine)]), ['Engine warnings in development', '0 KB in production']],
      ),
      controls: table(
        ['Import', 'React', 'Vue'],
        [
          [
            '`mapControls` from `/controls`, over `FormRenderer`',
            ...['react', 'vue'].map((pkg) => kb(sizes[`core + ${pkg} FormRenderer + /controls`] - sizes[`core + ${pkg} FormRenderer`])),
          ],
        ],
      ),
      trusted: table(
        ['App imports', 'Checked', 'Trusted'],
        TRUSTED.map(([label, name]) => [label, kb(sizes[name]), kb(sizes[`${name} (trusted)`])]),
      ),
      formhaus: table(
        ['Formhaus', 'gzip', 'State and validation', 'Rendering', 'Multi-step', 'Same validation on the server', 'JSON definitions'],
        [
          ['`@formhaus/core` `FormEngine` only', kb(engine), 'Yes', 'No', 'Yes', SERVER, 'Yes'],
          ['`@formhaus/core` + `@formhaus/react`', kb(sizes['core + react']), 'Yes', 'Yes', 'Yes', SERVER, 'Yes'],
          ['`@formhaus/core` + `@formhaus/vue`', kb(sizes['core + vue']), 'Yes', 'Yes', 'Yes', SERVER, 'Yes'],
        ],
      ),
      react: kb(sizes['core + react']),
      vue: kb(sizes['core + vue']),
    },
  };
}

function eachBlock(callback) {
  const found = new Set();
  for (const file of DOC_FILES) {
    const text = readFileSync(file, 'utf8');
    const next = text.replace(MARKER, (match, _start, name, content) => {
      found.add(name);
      return callback(name, content, file) ?? match;
    });
    if (next !== text) writeFileSync(file, next);
  }
  return found;
}

function requireAll(found, blocks) {
  const missing = Object.keys(blocks).filter((name) => !found.has(name));
  if (missing.length) throw new Error(`No size markers for ${missing.join(', ')} in ${DOC_FILES.join(', ')}`);
}

export function writeBlocks(blocks) {
  requireAll(
    eachBlock((name) => (name in blocks ? `<!-- size:${name}:start -->${blocks[name]}<!-- size:${name}:end -->` : undefined)),
    blocks,
  );
}

const shape = (text) => text.replace(VALUE, '# KB');
const values = (text) => [...text.matchAll(VALUE)].map((match) => Number(match[1]));

export function checkBlocks(blocks) {
  const problems = [];
  const found = eachBlock((name, content, file) => {
    if (!(name in blocks)) return undefined;
    const fresh = blocks[name];
    const committed = values(content);
    const measured = values(fresh);
    if (shape(content) !== shape(fresh)) problems.push(`${file}: size:${name} differs from the generated table`);
    else
      committed.forEach((value, index) => {
        if (Math.abs(value - measured[index]) > TOLERANCE_KB)
          problems.push(`${file}: size:${name} says ${value} KB, measured ${measured[index]} KB`);
      });
    return undefined;
  });
  requireAll(found, blocks);
  return problems;
}
