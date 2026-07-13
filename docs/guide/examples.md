# Examples

The JSON files in [`examples/definitions`](https://github.com/ignsm/formhaus/tree/main/examples/definitions) drive the documentation playground.

## Available definitions

| File | Type | What it shows |
|------|------|---------------|
| [`basic-form.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/basic-form.json) | Single step | Text, autocomplete, datetime, and basic validation |
| [`conditional-fields.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/conditional-fields.json) | Single step | Payment fields controlled by `show` conditions |
| [`multi-step.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/multi-step.json) | 3 steps | Navigation, progress, defaults, and several field types |
| [`validation.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/validation.json) | Single step | Length, pattern, range, and `matchField` validation |

## Next steps

- [Figma Plugin](/guide/figma): render these definitions as Figma mockups
- [/formhaus-create-form](/guide/formhaus-create-form): generate new definitions with Claude
- [Definition Reference](/api/definition): full TypeScript types
