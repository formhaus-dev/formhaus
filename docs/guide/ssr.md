---
title: "Server rendering"
description: "Render Formhaus forms on the server with Next.js App Router or Nuxt and hydrate them without mismatches. Load Cloud forms on the server with initialForm."
---

# Server rendering

`FormRenderer` and `FormhausForm` render on the server and hydrate on the client without mismatches.

## What runs where

- `@formhaus/core` does not touch the DOM. The engine, `validateSubmission()` and `fetchForm()` run in Node, server components and route handlers.
- Field ids come from React `useId` and Vue `useId`. On Vue 3.3 and 3.4 the ids come from the component's position in the app, so the server and the client get the same ids.
- Hidden fields with a `source` render their `defaultValue` on the server. Page values such as the query string, referrer, language and time zone are read after hydration.
- Focus, the bot check and draft restore run after mount.

## Next.js App Router

The server component loads the definition. `FormRenderer` takes an `onSubmit` function, so it goes in a `'use client'` component:

<<< @/../examples/nextjs-app-router/app/page.tsx

<<< @/../examples/nextjs-app-router/app/signup-form.tsx

The definition can also come from a database or an API. Fetch it in the server component and pass it as a prop. Full example with the route handler: [Next.js App Router](/guide/integrations/nextjs).

## Nuxt

Nuxt renders pages on the server by default. `FormRenderer` needs no wrapper:

<<< @/../examples/nuxt/app/pages/index.vue

Full example with the server route: [Nuxt](/guide/integrations/nuxt).

## Cloud forms

Without `initialForm`, `FormhausForm` renders its `fallback` on the server and loads the form in the browser. Load the form on the server with `fetchForm()` and pass it as `initialForm`. The server HTML then holds the whole form, and the browser makes no request for it.

Next.js: `@formhaus/react/cloud` is a client module, so a server component renders `FormhausForm` directly:

<<< @/recipes/snippets/ssr-cloud-page.tsx

Nuxt: `useAsyncData` sends the loaded form to the client with the page payload:

<<< @/recipes/snippets/ssr-cloud-page.vue

If the load fails, `initialForm` is empty and the form loads in the browser. `revalidate` keeps a cached Next.js page within a minute of the published version.

## What to avoid

- Reading `window`, `document`, `localStorage` or the current time in a custom field component during render. Read them in `useEffect` or `onMounted`.
- `initialValues` that differ between the server and the client, for example values from `localStorage`. Pass the same values on both sides, or set them after mount with the [`setValue` handle](/guide/#definition-and-initial-values).
- Formatting dates or numbers with the default locale in a custom component. The server locale can differ from the browser locale. Pass an explicit locale.
- Two server-rendered Vue apps on one page. Give each app its own `app.config.idPrefix`, so the field ids do not collide.
- On Vue 3.3 and 3.4, a form inside an async component or `<Suspense>` hydrates late, and the field ids of the other forms in the same app shift. Mount such a form as its own app with its own `idPrefix`, or use Vue 3.5.
