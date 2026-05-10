---
"@formhaus/react": patch
---

Fixed `FormRenderer` crashing under React SSR (Next.js prerender, `renderToString`) with "Missing getServerSnapshot". `useFormEngine` now provides a server snapshot and stable subscribe/getSnapshot callbacks.

Apps that wrapped `FormRenderer` in `next/dynamic({ ssr: false })` to avoid the crash can drop the wrapper and recover prerendering.
