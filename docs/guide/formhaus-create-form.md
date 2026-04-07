# /formhaus-create-form

Generate valid `@formhaus/core` form definitions from natural language, CSV data, or screenshots.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- The formhaus repo cloned locally

## Usage

```
/formhaus-create-form
```

Then describe your form:

> "Registration form with name, email, password, confirm password, and agree to terms"

The skill:
1. Infers field types automatically (email fields get `type: "email"`, toggles get `type: "switch"`, etc.)
2. Asks if you want single-step or multi-step layout
3. Suggests conditional visibility rules
4. Adds validation (required, pattern, matchField)
5. Outputs ready-to-use JSON

## Input formats

| Format | Example |
|--------|---------|
| Text description | "Contact form with name, email, and message" |
| CSV/table | A table with columns: key, type, label, required |
| Screenshot | Path to an image of an existing form |
| Fixture reference | "Like the dispute form but with an address step" |

## Output

The generated form definition works with:

- The [Figma plugin](/guide/figma): paste into the Generate tab
- [React adapter](https://github.com/ignsm/formhaus/tree/main/packages/react): pass to `FormRenderer`
- [Vue adapter](https://github.com/ignsm/formhaus/tree/main/packages/vue): pass to `FormRenderer`

## Next steps

- [/formhaus-figma-connect](/guide/formhaus-figma-connect): connect your design system to the Figma plugin
- [Field Types](/guide/fields): all supported form field types
- [Definition Reference](/api/definition): full TypeScript types
