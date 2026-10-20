import { checkDefinition, FormEngine } from '../packages/core/dist/index.js';
import { validateSubmission } from '../packages/core/dist/server.js';

const RUNS = Number(process.env.BENCH_RUNS ?? 20);

const people = (fields) => ({
  formatVersion: '1.1',
  id: 'g',
  title: 'G',
  submit: { label: 'Send' },
  fields: [{ key: 'people', type: 'group', label: 'People', fields }],
});

const cells = Array.from({ length: 50 }, (_, index) => ({ key: `t${index}`, type: 'text', label: 'T' }));
const roles = {
  key: 'roles',
  type: 'multiselect',
  label: 'Roles',
  options: [
    { value: 'x', label: 'X' },
    { value: 'y', label: 'Y' },
  ],
};
const shown = Array.from({ length: 50 }, (_, index) => ({
  key: `s${index}`,
  type: 'text',
  label: 'S',
  show: [index % 2 ? { field: 'roles', contains: `q${index}` } : { field: 'roles', notContains: `q${index}` }],
}));
const huge = Array.from({ length: 250_000 }, () => 'x');
const pattern = (value) => ({
  id: 'p',
  title: 'P',
  submit: { label: 'Send' },
  fields: [{ key: 'code', type: 'text', label: 'Code', validation: { pattern: value } }],
});

const LONG = 4000;
const line = (index, show) => ({
  key: `f${index}`,
  type: 'text',
  label: 'F',
  ...(show && index ? { show: [{ field: `f${index - 1}`, eq: 'x' }] } : {}),
});
const flatFields = Array.from({ length: LONG }, (_, index) => line(index, false));
const chainFields = Array.from({ length: LONG }, (_, index) => line(index, true));
const longForm = (fields) => ({ id: 'l', title: 'L', submit: { label: 'Send' }, fields });
const longSteps = (size, step) => ({
  id: 'l',
  title: 'L',
  submit: { label: 'Send' },
  steps: Array.from({ length: LONG / size }, (_, index) => ({ id: `s${index}`, title: 'S', ...step(index, size) })),
});
const fieldChain = longSteps(10, (index, size) => ({ fields: chainFields.slice(index * size, index * size + size) }));
const stepChain = longSteps(1, (index) => ({
  ...(index ? { show: [{ field: `f${index - 1}`, eq: 'x' }] } : {}),
  fields: [line(index, false)],
}));
const answered = Object.fromEntries(flatFields.map(({ key }) => [key, 'x']));
const unanswered = Object.fromEntries(flatFields.slice(1).map(({ key }) => [key, 'x']));
const engine = (definition, values) => new FormEngine(definition, values, { onWarning: () => {} });

const cases = [
  ['validateSubmission: 4,000 fields', longForm(flatFields), answered, validateSubmission],
  ['validateSubmission: 4,000-field show chain', longForm(chainFields), unanswered, validateSubmission],
  ['validateSubmission: 4,000-field show chain over 400 steps', fieldChain, unanswered, validateSubmission],
  ['validateSubmission: 4,000-step show chain', stepChain, unanswered, validateSubmission],
  ['new FormEngine: 4,000 fields', longForm(flatFields), answered, engine],
  ['new FormEngine: 4,000-field show chain', longForm(chainFields), unanswered, engine],
  ['new FormEngine: 4,000-field show chain over 400 steps', fieldChain, unanswered, engine],
  ['new FormEngine: 4,000-step show chain', stepChain, unanswered, engine],
  [
    'validateSubmission: 100,000 group items over the limit',
    people([{ key: 'name', type: 'text', label: 'Name' }]),
    { people: Array.from({ length: 100_000 }, () => ({})) },
    validateSubmission,
  ],
  [
    'validateSubmission: 100 items of 50 invalid cells',
    people(cells),
    { people: Array.from({ length: 100 }, () => Object.fromEntries(cells.map(({ key }) => [key, {}]))) },
    validateSubmission,
  ],
  [
    'validateSubmission: 250,000-item multiselect in each of 100 items',
    people([roles, ...shown]),
    { people: Array.from({ length: 100 }, () => ({ roles: huge })) },
    validateSubmission,
  ],
  ['checkDefinition: nested groups pattern', pattern('('.repeat(500) + '+)+'.repeat(500)), undefined, checkDefinition],
  ['checkDefinition: 120,000-character pattern', pattern('((a+)+'.repeat(20_000)), undefined, checkDefinition],
  ['checkDefinition: long alternation pattern', pattern(`${'(a|'.repeat(300)}b`), undefined, checkDefinition],
];

const rows = cases.map(([name, definition, values, run]) => {
  run(definition, values);
  const times = Array.from({ length: RUNS }, () => {
    const start = performance.now();
    run(definition, values);
    return performance.now() - start;
  }).sort((a, b) => a - b);
  return { name, median: times[Math.floor(RUNS / 2)].toFixed(2), max: times[RUNS - 1].toFixed(2) };
});

console.table(rows);
