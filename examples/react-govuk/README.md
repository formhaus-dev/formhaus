# React + GOV.UK Design System example

Renders Formhaus forms with the markup and CSS of [govuk-frontend](https://frontend.design-system.service.gov.uk/). GOV.UK has no official React package, so the components in this example output the same HTML as the GOV.UK Nunjucks macros.

```bash
pnpm install
pnpm dev
```

## Font

The GDS Transport font may only be used on `service.gov.uk` domains. [src/styles.scss](src/styles.scss) sets `$govuk-font-family` to Arial, as the govuk-frontend docs describe for services outside gov.uk, so the font files are not included.

## Files

- [src/component-map.tsx](src/component-map.tsx) maps the field types to GOV.UK controls with `mapControls`, one entry per type, and lists the layout slots.
- [src/fields/Shell.tsx](src/fields/Shell.tsx) renders `govuk-form-group` with label or legend, hint and error message.
- [src/fields/controls.tsx](src/fields/controls.tsx) renders the GOV.UK input, textarea, select, checkbox and radio markup. The radios cover scale, rating and matrix rows.
- [src/fields/DateInput.tsx](src/fields/DateInput.tsx) renders the `govuk-date-input` pattern and emits `YYYY-MM-DD`. [FileField.tsx](src/fields/FileField.tsx) renders `govuk-file-upload`.
- [src/layout/ErrorSummary.tsx](src/layout/ErrorSummary.tsx) renders `govuk-error-summary` with links to the fields.
