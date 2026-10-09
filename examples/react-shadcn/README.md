# React + shadcn/ui example

This example maps Formhaus `FieldComponentProps` to [shadcn/ui](https://ui.shadcn.com) components through the `components` prop.

[Open in StackBlitz](https://stackblitz.com/github/ignsm/formhaus/tree/main/examples/react-shadcn)

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Setup

The project was created with `shadcn init --template vite --base base --preset nova` (Vite, Tailwind CSS v4, Base UI primitives) and `shadcn add input select checkbox radio-group button label card`. The generated files in [src/components/ui](src/components/ui) are committed unchanged.

## Files

- [src/component-map.ts](src/component-map.ts) maps each Formhaus field type to a shadcn renderer.
- [src/fields/TextField.tsx](src/fields/TextField.tsx) renders text, email, phone, number, password, and date fields with `Input`.
- [src/fields/SelectField.tsx](src/fields/SelectField.tsx) renders `select` with `Select`.
- [src/fields/RadioField.tsx](src/fields/RadioField.tsx) and [src/fields/CheckboxField.tsx](src/fields/CheckboxField.tsx) use `RadioGroup` and `Checkbox`.
- [src/FormActions.tsx](src/FormActions.tsx) renders Back and Continue with `Button`.
- [src/definition.json](src/definition.json) is a branching form: the Team plan routes to company details, the Personal plan to a name step.

## Use as a starter

Copy the folder, then change `definition.json`. Add more shadcn components with `pnpm dlx shadcn@latest add <name>` and map them in `component-map.ts`.
