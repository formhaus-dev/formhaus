# @formhaus/vue

## 0.4.0 - 2026-05-10

### Minor

- New `AutocompleteField` for `type: 'autocomplete'`. Renders `<input>` + `<datalist>` — native browser filtering, SSR-safe. For richer pickers (Vuetify `<v-autocomplete>`, Element Plus `<el-autocomplete>`) plug in your own component via `components`.
- New `DateTimeField` for `type: 'datetime'`. Renders `<input type="datetime-local">`.

### Patch

- Source maps now ship alongside the minified bundle.

### Peer

- Bumped `@formhaus/core` to `^0.4.0`.
