const namedColors =
  'white|black|red|green|blue|gray|grey|silver|orange|yellow|purple|pink|brown|navy|teal|maroon|olive|lime|aqua|fuchsia|cyan|magenta|gold|indigo|violet';
const rawColor = `#[0-9a-fA-F]{3,8}|\\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(|^(${namedColors})$`;
const sides = ['', '-top', '-right', '-bottom', '-left', '-block', '-inline', '-block-start', '-block-end', '-inline-start', '-inline-end'];
const sizeProperties = [...sides.flatMap((side) => [`margin${side}`, `padding${side}`]), 'gap', 'row-gap', 'column-gap', 'font-size'];
const colorProperties = [
  'color',
  'background',
  'background-color',
  'outline',
  'outline-color',
  'box-shadow',
  'text-shadow',
  'fill',
  'stroke',
  'caret-color',
  'accent-color',
  'text-decoration-color',
  ...sides.flatMap((side) => [`border${side}`, `border${side}-color`]),
];
const tokenRule = (properties) => [
  properties,
  {
    ignoreFunctions: false,
    ignoreValues: Object.fromEntries(properties.map((property) => [property, sizeProperties.includes(property) ? noRawPx : noRawColor])),
    message: 'Use a design token for "${value}" of "${property}"',
  },
];
const noRawPx = '/^(?!-?\\d*\\.?\\d+px$)/';
const noRawColor = `/^(?!.*(${rawColor}))/`;

export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/storybook-static/**',
    'docs/.vitepress/cache/**',
    'docs/.vitepress/dist/**',
    'examples/**',
    'packages/figma/**',
  ],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'selector-class-pattern': null,
    'declaration-block-single-line-max-declarations': null,
    'no-descending-specificity': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'media-feature-range-notation': null,
    'color-hex-length': 'long',
    'value-keyword-case': ['lower', { camelCaseSvgKeywords: true, ignoreProperties: ['/^--/', 'font-family'] }],
    'property-no-vendor-prefix': [true, { ignoreProperties: ['-webkit-mask'] }],
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
    'scale-unlimited/declaration-strict-value': tokenRule([...sizeProperties, ...colorProperties]),
  },
  overrides: [
    {
      files: ['packages/core/style.css'],
      rules: { 'scale-unlimited/declaration-strict-value': tokenRule(colorProperties) },
    },
  ],
};
