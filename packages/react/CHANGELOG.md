# @formhaus/react

## 0.4.0 - 2026-05-10

### Minor

- New `AutocompleteField` for `type: 'autocomplete'`. Renders `<input>` + `<datalist>` — native browser filtering, SSR-safe. For richer pickers (MUI `Autocomplete`, Headless UI `Combobox`) plug in your own component via `components`.
- New `DateTimeField` for `type: 'datetime'`. Renders `<input type="datetime-local">`.

### Patch

- Fixed `FormRenderer` crashing under React SSR (Next.js prerender, `renderToString`) with "Missing getServerSnapshot". `useFormEngine` now provides a server snapshot and stable subscribe/getSnapshot callbacks. Apps that wrapped `FormRenderer` in `next/dynamic({ ssr: false })` to avoid the crash can drop the wrapper and recover prerendering.
- Source maps now ship alongside the minified bundle.

### Peer

- Bumped `@formhaus/core` to `^0.4.0`.
