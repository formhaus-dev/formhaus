# @formhaus/core

## 0.4.0 - 2026-05-10

### Minor

- New `'autocomplete'` member of `DefaultFieldType` for type-to-filter dropdowns. The default React and Vue renderers use `<input>` + `<datalist>` (native browser filtering, SSR-safe). Note: native `<datalist>` filters by `value`, not `label`, and does not enforce that the typed value is one of the options. See the field types guide.
- New `'datetime'` member of `DefaultFieldType`. The default React and Vue renderers use `<input type="datetime-local">`, which emits `YYYY-MM-DDTHH:mm` without timezone. For richer pickers or ISO output, plug in your own component via `components`. See the field types guide.
- New optional baseline stylesheet at `@formhaus/core/style.css`. Import it for sensible default styling on the native field components: padding, focus state, error colour, button styles, step progress bar. Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). The `sideEffects` field is now `["**/*.css"]` so bundlers preserve the import.

### Patch

- Fixtures are no longer published to npm. They were demo data for the docs and playground, never reachable from consumer code (`exports` only declared the root entry, so `import x from '@formhaus/core/fixtures/basic-form.json'` failed under strict ESM anyway). The Quick Start guide now shows a literal definition object.
- Source maps now ship alongside the minified bundle. Stack traces in consumer apps point at the original source line in `src/`, not minified one-letter variables.
