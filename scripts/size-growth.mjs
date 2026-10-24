import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { measureEntries } from './size/measure.mjs';

const ENTRIES = ['core', 'core + react FormRenderer', 'core + vue FormRenderer'];
const THRESHOLD = 1024;
const MARKER = '<!-- size-growth -->';

const signed = (bytes) => `${bytes > 0 ? '+' : ''}${bytes} B`;

function growthReport(base, head) {
  const rows = ENTRIES.map((name) => ({ name, base: base[name], head: head[name], delta: head[name] - base[name] }));
  const exceeded = rows.some((row) => row.delta > THRESHOLD);
  const table = [
    '| Entry | Base | Head | Delta |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map((row) => `| ${row.name} | ${row.base} B | ${row.head} B | ${signed(row.delta)} |`),
  ].join('\n');
  return { exceeded, table };
}

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

const [command, ...args] = process.argv.slice(2);

if (command === 'measure') {
  console.log(JSON.stringify(await measureEntries(ENTRIES), null, 2));
} else if (command === 'report') {
  const [baseFile, headFile, outFile] = args;
  const { exceeded, table } = growthReport(JSON.parse(readFileSync(baseFile, 'utf8')), JSON.parse(readFileSync(headFile, 'utf8')));
  const intro = `Gzipped size of the entry points on this pull request against its base. Growth over ${THRESHOLD} B is flagged.`;
  const body = `${MARKER}\n${exceeded ? '### Bundle size grew by more than 1 KB\n\n' : '### Bundle size\n\n'}${intro}\n\n${table}\n`;
  writeFileSync(outFile, body);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${body.replace(`${MARKER}\n`, '')}\n`);
  if (exceeded) console.log(`::warning title=Bundle size::An entry grew by more than ${THRESHOLD} B gzipped. See the job summary.`);
  output('exceeded', exceeded);
} else {
  console.error('Usage: size-growth.mjs measure | report <base.json> <head.json> <out.md>');
  process.exit(1);
}
