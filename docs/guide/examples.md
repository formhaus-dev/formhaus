# Examples

The JSON files in [`examples/definitions`](https://github.com/ignsm/formhaus/tree/main/examples/definitions) drive the documentation playground.

## Available definitions

| File | Type | What it shows |
|------|------|---------------|
| [`basic-form.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/basic-form.json) | Single step | Text, autocomplete, datetime, and basic validation |
| [`conditional-fields.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/conditional-fields.json) | Single step | Payment fields controlled by `show` conditions |
| [`multi-step.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/multi-step.json) | 3 steps | Navigation, progress, defaults, and several field types |
| [`validation.json`](https://github.com/ignsm/formhaus/blob/main/examples/definitions/validation.json) | Single step | Length, pattern, range, and `matchField` validation |

## Branching with radio activation

[`branching-form.json`](https://github.com/ignsm/formhaus/blob/c2bc73d57a13733352151590af1bb3fdcc796434/examples/definitions/branching-form.json) selects a business or personal path from a radio answer, then explicitly converges at review. It includes `autoAdvance` and hides Next on the radio step. Use it with the [routing guide](/guide/steps#route-between-branches); it is a standalone definition, not a playground preset.

## Next steps

- [Figma Plugin](/guide/figma): render these definitions as Figma mockups
- [/formhaus-create-form](/guide/formhaus-create-form): generate new definitions with Claude
- [Definition Reference](/api/definition): full TypeScript types
