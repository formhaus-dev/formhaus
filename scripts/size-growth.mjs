import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { attributeEntry, topGrowth } from './size/attribute.mjs';
import { measureEntries } from './size/measure.mjs';

const ENTRIES = ['core', 'core FormEngine', 'core + react FormRenderer', 'core + vue FormRenderer'];
const THRESHOLD = 512;
const MARKER = '<!-- size-growth -->';
const SIZE_SECTION = /^##\s+Size\s*$/im;

const signed = (bytes) => `${bytes > 0 ? '+' : ''}${bytes} B`;
const readJson = (file) => (file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);

async function measure() {
  const sizes = await measureEntries(ENTRIES);
  const files = {};
  for (const name of ENTRIES) files[name] = await attributeEntry(name);
  return { sizes, files };
}

function sizeTable(base, head, tag, tagName) {
  const heading = ['Entry', 'Base', 'Head', 'Delta', ...(tag ? [`since ${tagName}`] : [])];
  const rows = ENTRIES.map((name) => {
    const cells = [name, `${base.sizes[name]} B`, `${head.sizes[name]} B`, signed(head.sizes[name] - base.sizes[name])];
    if (tag) cells.push(signed(head.sizes[name] - tag.sizes[name]));
    return cells;
  });
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(heading), line(heading.map((_, index) => (index ? '---:' : '---'))), ...rows.map(line)].join('\n');
}

function growthDetails(base, head) {
  return ENTRIES.filter((name) => head.sizes[name] - base.sizes[name] > THRESHOLD)
    .map((name) => {
      const lines = topGrowth(base.files[name], head.files[name]).map((row) => `- \`${row.source}\`: ${signed(row.delta)}`);
      return `**${name}** grew most in:\n\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

function report([baseFile, headFile, tagFile, bodyFile, outFile]) {
  const base = readJson(baseFile);
  const head = readJson(headFile);
  const tag = readJson(tagFile);
  const grown = ENTRIES.filter((name) => head.sizes[name] - base.sizes[name] > THRESHOLD);
  const documented = SIZE_SECTION.test(readFileSync(bodyFile, 'utf8'));
  const blocked = grown.length > 0 && !documented;
  const intro = `Gzipped size of the entry points on this pull request against its base. Growth over ${THRESHOLD} B needs a \`## Size\` section in the pull request description.`;
  const heading = grown.length ? `### Bundle size grew by more than ${THRESHOLD} B` : '### Bundle size';
  const missing = blocked ? '**The pull request description has no `## Size` section.** Explain the growth there.' : '';
  const details = growthDetails(base, head);
  const body = [MARKER, heading, intro, sizeTable(base, head, tag, process.env.TAG), missing, details].filter(Boolean).join('\n\n');
  writeFileSync(outFile, `${body}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${body.replace(`${MARKER}\n\n`, '')}\n`);
  if (blocked) {
    console.log(
      `::error title=Bundle size::${grown.join(', ')} grew by more than ${THRESHOLD} B gzipped. Add a "## Size" section to the pull request description explaining why.`,
    );
    process.exitCode = 1;
  }
}

const [command, ...args] = process.argv.slice(2);

if (command === 'measure') {
  console.log(JSON.stringify(await measure(), null, 2));
} else if (command === 'report') {
  report(args);
} else {
  console.error('Usage: size-growth.mjs measure | report <base.json> <head.json> <tag.json> <body.md> <out.md>');
  process.exit(1);
}
