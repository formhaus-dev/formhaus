# React + shadcn/ui example

This example maps Formhaus `FieldComponentProps` to [shadcn/ui](https://ui.shadcn.com) components through the `components` prop.

[Open in StackBlitz](https://stackblitz.com/github/formhaus-dev/formhaus/tree/main/examples/react-shadcn)

## Run

This example is its own pnpm workspace and installs `@formhaus/*` from npm:

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:5173.

## Setup

The project was created with `shadcn init --template vite --base base --preset nova` (Vite, Tailwind CSS v4, Base UI primitives) and `shadcn add input select checkbox radio-group button label card textarea`. The generated files in [src/components/ui](src/components/ui) are committed unchanged.

## Files

- [src/component-map.tsx](src/component-map.tsx) maps the field types to shadcn components with `mapControls`, one entry per type: `Input`, `Textarea`, `Checkbox`, `Switch` and `RadioGroup`, plus a checkbox group for `multiselect`.
- [src/fields/Shell.tsx](src/fields/Shell.tsx) draws the label, helper text and error around each control.
- [src/fields/choices.tsx](src/fields/choices.tsx) builds the radio, checkbox, scale and star options. [SelectControl.tsx](src/fields/SelectControl.tsx) wraps `Select`, [AutocompleteInput.tsx](src/fields/AutocompleteInput.tsx) is an `Input` with a `<datalist>` that keeps typed text, and [MatrixRow.tsx](src/fields/MatrixRow.tsx) renders a matrix row with the same `RadioGroup` as radio fields.
- [src/FormActions.tsx](src/FormActions.tsx) renders Back and Continue with `Button`.
- [src/definition.json](src/definition.json) is a branching form: the Team plan routes to company details, the Personal plan to a name step.

## Use as a starter

Copy the folder, then change `definition.json`. Add more shadcn components with `pnpm dlx shadcn@latest add <name>` and map them in `component-map.tsx`.
