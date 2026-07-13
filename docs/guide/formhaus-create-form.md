# /formhaus-create-form

Generate an `@formhaus/core` form definition from a description, CSV data, or a screenshot.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- The formhaus repo cloned locally

## Usage

```
/formhaus-create-form
```

Then describe your form:

> "Registration form with name, email, password, confirm password, and agree to terms"

The skill infers field types and validation rules, then asks about steps and conditional visibility when the answer is not clear from the input. It returns JSON that matches the current `FormDefinition` type.

## Input formats

| Format | Example |
|--------|---------|
| Text description | "Contact form with name, email, and message" |
| CSV/table | A table with columns: key, type, label, required |
| Screenshot | Path to an image of an existing form |
| Example reference | "Like the multi-step example but add a payment step" |

## Output

The generated form definition works with:

- The [Figma plugin](/guide/figma): paste into the Generate tab
- [React adapter](https://github.com/ignsm/formhaus/tree/main/packages/react): pass to `FormRenderer`
- [Vue adapter](https://github.com/ignsm/formhaus/tree/main/packages/vue): pass to `FormRenderer`

## Next steps

- [/formhaus-figma-connect](/guide/formhaus-figma-connect): connect your design system to the Figma plugin
- [Field Types](/guide/fields): all supported form field types
- [Definition Reference](/api/definition): full TypeScript types
