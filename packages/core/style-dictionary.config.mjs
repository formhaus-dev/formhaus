const BASE = ':where(.fh-cloud, .fh-form:not(.fh-cloud .fh-form))';
const AUTO = ':where(.fh-cloud, .fh-form)';
const PUBLIC = ':where(.fh-form:not(.fh-cloud .fh-form))';
const DARK_BASE =
  ':where([data-fh-theme="dark"] :is(.fh-cloud, .fh-form:not(.fh-cloud .fh-form)), :is(.fh-form, .fh-cloud)[data-fh-theme="dark"])';
const DARK_AUTO = ':where([data-fh-theme="dark"] :is(.fh-cloud, .fh-form), :is(.fh-form, .fh-cloud)[data-fh-theme="dark"])';

export const MIX_SUPPORTS = '@supports (color: color-mix(in srgb, red, blue))';

export const CONTEXTS = [
  { modifier: 'theme', context: 'dark', base: DARK_BASE, auto: DARK_AUTO, declarations: ['color-scheme: dark'] },
  { modifier: 'width', context: 'compact', media: '@media (max-width: 480px)', base: BASE, auto: AUTO },
  { modifier: 'pointer', context: 'coarse', media: '@media (pointer: coarse)', base: BASE, auto: AUTO },
  { modifier: 'contrast', context: 'more', media: '@media (prefers-contrast: more)', base: BASE, auto: AUTO },
];

export const DEFAULT_CONTEXT = { base: BASE, auto: AUTO, public: PUBLIC };

const isPrimitive = (token) => token.filePath.endsWith('primitive.tokens.json');
const meta = (token) => token.original.$extensions?.['dev.formhaus'] ?? {};
const aliasPath = (value) => (typeof value === 'string' && /^\{[^{}]+\}$/.test(value) ? value.slice(1, -1) : undefined);
const channel = (value) => Math.round(value * 255);

function colorToCss(value) {
  if (typeof value === 'string') return value;
  const alpha = value.alpha ?? 1;
  if (alpha === 1) return value.hex ?? `#${value.components.map((c) => channel(c).toString(16).padStart(2, '0')).join('')}`;
  return `rgba(${value.components.map(channel).join(', ')}, ${alpha})`;
}

function dimensionToCss(value) {
  if (typeof value === 'string') return value;
  return value.value === 0 ? '0' : `${value.value}${value.unit}`;
}

const hooks = {
  transforms: {
    'fh/name': {
      type: 'name',
      transform: (token) => `fh-${token.path.filter((part) => part !== 'default').join('-')}`,
    },
    'fh/color/css': {
      type: 'value',
      filter: (token) => token.$type === 'color',
      transform: (token) => colorToCss(token.$value),
    },
    'fh/dimension/css': {
      type: 'value',
      filter: (token) => token.$type === 'dimension',
      transform: (token) => dimensionToCss(token.$value),
    },
    'fh/shadow/css': {
      type: 'value',
      filter: (token) => token.$type === 'shadow',
      transform: ({ $value: { offsetX, offsetY, blur, spread, color } }) =>
        [offsetX, offsetY, blur, spread.value === 0 ? undefined : spread, color]
          .filter(Boolean)
          .map((part) => (part.colorSpace ? colorToCss(part) : dimensionToCss(part)))
          .join(' '),
    },
  },
};

export function createConfig(source) {
  return {
    source,
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'disabled' },
    hooks,
    platforms: { css: { transforms: Object.keys(hooks.transforms) } },
  };
}

export function cssEntries(dictionary) {
  const byPath = new Map(dictionary.allTokens.map((token) => [token.path.join('.'), token]));
  const reference = (value, type) => {
    const path = aliasPath(value);
    if (!path) return type === 'color' ? colorToCss(value) : dimensionToCss(value);
    const target = byPath.get(path);
    if (!target) throw new Error(`Unknown token {${path}}`);
    return isPrimitive(target) ? target.$value : `var(--${target.name})`;
  };
  const expression = (token) => {
    const { add, mix } = meta(token);
    const value = token.original.$value;
    if (add) return `calc(${reference(add.base)} + ${dimensionToCss(add.amount)})`;
    if (mix)
      return `color-mix(in srgb, ${reference(mix.color, 'color')} ${+(mix.amount * 100).toFixed(4)}%, ${reference(mix.with, 'color')})`;
    if (token.$type === 'shadow') {
      const { offsetX, offsetY, blur, spread, color } = value;
      const parts = [offsetX, offsetY, blur, ...(dimensionToCss(spread) === '0' ? [] : [spread])].map((part) => reference(part));
      return [...parts, reference(color, 'color')].join(' ');
    }
    return aliasPath(value) ? reference(value) : token.$value;
  };
  const entries = [];
  for (const token of dictionary.allTokens) {
    if (isPrimitive(token)) continue;
    const parent = token.path.slice(0, -1);
    const group = shorthandGroup(dictionary.tokens, parent);
    if (group) {
      if (token.path.at(-1) !== group.shorthand[0]) continue;
      const parts = group.shorthand.map((key) => expression(byPath.get([...parent, key].join('.'))));
      entries.push({
        token,
        name: `fh-${parent.join('-')}`,
        auto: group.auto,
        value: parts.join(' '),
        group: parent.slice(0, -1).join('.'),
      });
      continue;
    }
    const { auto, mix, fallback } = meta(token);
    entries.push({
      token,
      name: token.name,
      auto,
      value: mix ? colorToCss(fallback) : expression(token),
      mix: mix ? expression(token) : undefined,
      group: parent.join('.'),
    });
  }
  return entries;
}

function shorthandGroup(tree, path) {
  let node = tree;
  for (const part of path) node = node?.[part];
  return node?.$extensions?.['dev.formhaus']?.shorthand ? node.$extensions['dev.formhaus'] : undefined;
}
