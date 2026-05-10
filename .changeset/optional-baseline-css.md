---
"@formhaus/core": minor
---

Added optional baseline stylesheet at `@formhaus/core/style.css`. Import it for sensible default styling on the React and Vue native field components: padding, focus state, error colour, button styles, step progress bar.

```ts
import '@formhaus/core/style.css';
```

Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.) — no fork required. The stylesheet only targets the default `fh-*` classes; if you swap in your own components via the `components` prop, it doesn't touch them.

The package's `sideEffects` field is now `["**/*.css"]` (was `false`) so bundlers preserve the import.
