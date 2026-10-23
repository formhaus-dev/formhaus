# React + GOV.UK Design System example

Renders Formhaus forms with the markup and CSS of [govuk-frontend](https://frontend.design-system.service.gov.uk/). GOV.UK has no official React package, so the components in this example output the same HTML as the GOV.UK Nunjucks macros.

```bash
pnpm install
pnpm dev
```

## Font

The GDS Transport font may only be used on `service.gov.uk` domains. [src/styles.scss](src/styles.scss) sets `$govuk-font-family` to Arial, as the govuk-frontend docs describe for services outside gov.uk, so the font files are not included.

## Files

- [src/component-map.ts](src/component-map.ts) lists the field and layout mappings.
- [src/fields/FormGroup.tsx](src/fields/FormGroup.tsx) renders `govuk-form-group` with label or legend, hint and error message.
- [src/fields/DateField.tsx](src/fields/DateField.tsx) renders the `govuk-date-input` pattern and emits `YYYY-MM-DD`.
- [src/fields/RadioField.tsx](src/fields/RadioField.tsx) covers radios, scale, rating and matrix rows.
- [src/layout/ErrorSummary.tsx](src/layout/ErrorSummary.tsx) renders `govuk-error-summary` with links to the fields.
