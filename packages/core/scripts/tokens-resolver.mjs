import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { createConfig } from '../style-dictionary.config.mjs';

const RESOLVER_FILE = 'formhaus.resolver.json';

function tokenFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return tokenFiles(path);
    return entry.name.endsWith('.tokens.json') ? [path] : [];
  });
}

export function readResolver(tokensDir) {
  const resolver = JSON.parse(readFileSync(resolve(tokensDir, RESOLVER_FILE), 'utf8'));
  const problems = [];
  const files = (list, owner) =>
    (list ?? []).map((item) => {
      if (typeof item?.$ref !== 'string' || item.$ref.startsWith('#')) throw new Error(`${owner}: only file references are supported`);
      const path = resolve(tokensDir, item.$ref);
      if (!existsSync(path)) problems.push(`${owner}: ${item.$ref} does not exist`);
      return path;
    });
  const sets = resolver.sets ?? {};
  const modifiers = resolver.modifiers ?? {};
  const used = new Set();
  const order = (resolver.resolutionOrder ?? []).map((item) => {
    const match = /^#\/(sets|modifiers)\/([^/]+)$/.exec(item?.$ref ?? '');
    if (!match) throw new Error(`resolutionOrder: ${JSON.stringify(item)} is not a set or modifier reference`);
    const [, kind, name] = match;
    const target = (kind === 'sets' ? sets : modifiers)[name];
    if (!target) throw new Error(`resolutionOrder: ${item.$ref} is not defined`);
    if (used.has(item.$ref)) throw new Error(`resolutionOrder: ${item.$ref} is listed twice`);
    used.add(item.$ref);
    if (kind === 'sets') return { kind, name, sources: files(target.sources, `sets.${name}`) };
    const contexts = Object.fromEntries(
      Object.entries(target.contexts ?? {}).map(([context, list]) => [context, files(list, `modifiers.${name}.${context}`)]),
    );
    if (!(target.default in contexts)) throw new Error(`modifiers.${name}: default ${target.default} is not a context`);
    return { kind, name, contexts, default: target.default };
  });
  for (const name of Object.keys(sets)) if (!used.has(`#/sets/${name}`)) problems.push(`sets.${name} is not in resolutionOrder`);
  for (const name of Object.keys(modifiers))
    if (!used.has(`#/modifiers/${name}`)) problems.push(`modifiers.${name} is not in resolutionOrder`);
  const referenced = new Set(order.flatMap((step) => (step.kind === 'sets' ? step.sources : Object.values(step.contexts).flat())));
  for (const path of tokenFiles(tokensDir))
    if (!referenced.has(path)) problems.push(`${relative(tokensDir, path)} is not referenced by ${RESOLVER_FILE}`);
  if (problems.length) throw new Error(problems.join('\n'));

  const modifierSteps = order.filter((step) => step.kind === 'modifiers');
  return {
    modifiers: modifierSteps,
    contextFiles: (modifier, context) => new Set(modifierSteps.find((step) => step.name === modifier).contexts[context]),
    sourcesFor: (selected = {}) =>
      order.flatMap((step) => {
        if (step.kind === 'sets') return step.sources;
        const context = selected[step.name] ?? step.default;
        if (!(context in step.contexts)) throw new Error(`modifiers.${step.name} has no context ${context}`);
        return step.contexts[context];
      }),
  };
}

export function combinations(modifiers) {
  return modifiers.reduce(
    (all, step) => all.flatMap((selected) => Object.keys(step.contexts).map((context) => ({ ...selected, [step.name]: context }))),
    [{}],
  );
}

export async function loadDictionary(sources) {
  return new StyleDictionary(createConfig(sources)).getPlatformTokens('css');
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const toHex = (rgb) =>
  `#${rgb
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

function derivedProblems(dictionary, label) {
  const problems = [];
  for (const token of dictionary.allTokens) {
    const original = token.original.$value;
    if (token.$type === 'color' && original?.hex && toHex(original.components) !== original.hex) {
      problems.push(`${token.path.join('.')}: hex ${original.hex} does not match components`);
    }
    const { add, mix } = token.$extensions?.['dev.formhaus'] ?? {};
    let expected;
    if (add) expected = `${Number.parseFloat(add.base) + add.amount.value}${add.amount.unit}`;
    if (mix) {
      const [a, b] = [mix.color, mix.with].map(hexToRgb);
      expected = toHex(a.map((c, i) => c * mix.amount + b[i] * (1 - mix.amount)));
    }
    if (expected && expected !== token.$value) {
      problems.push(`${token.path.join('.')} in ${label}: $value is ${token.$value}, the rule gives ${expected}`);
    }
  }
  return problems;
}

export async function validateTokens(tokensDir) {
  const resolver = readResolver(tokensDir);
  const problems = new Set();
  for (const selected of combinations(resolver.modifiers)) {
    const label = Object.entries(selected)
      .map(([name, context]) => `${name} ${context}`)
      .join(', ');
    for (const problem of derivedProblems(await loadDictionary(resolver.sourcesFor(selected)), label)) problems.add(problem);
  }
  return { resolver, problems: [...problems] };
}
