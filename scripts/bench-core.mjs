import { checkDefinition } from '../packages/core/dist/index.js';
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

const cases = [
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
