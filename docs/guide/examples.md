# Examples

Example form schemas showing different features. These same JSON files drive both Vue and React stories.

## Dispute Form

A 3-step form with conditional fields (disputed amount only shows for "wrong amount" reason) and a cancel button.

Steps:
1. **Transaction details** - transaction ID, reason (radio), disputed amount (conditional)
2. **Additional details** - description (textarea, min 20 chars), contact preference, phone (conditional)
3. **Review & Submit** - acknowledgement checkbox

Schema: [`fixtures/dispute-form.json`](https://github.com/ignsm/formhaus/blob/main/packages/core/fixtures/dispute-form.json)

## All fixtures

| File | Type | Steps | Key features |
|------|------|-------|-------------|
| `basic-form.json` | Single step | 1 | Text + select, basic validation |
| `validation-form.json` | Single step | 1 | All validation rules, matchField |
| `conditional-fields.json` | Single step | 1 | Payment method switches fields |
| `multi-step-form.json` | Multi step | 3 | Linear steps with preferences |
| `conditional-steps.json` | Multi step | 3 | Business step hidden for personal |
| `dispute-form.json` | Multi step | 3 | Dispute with cancel button |

## Next steps

- [Figma Plugin](/guide/figma): render these schemas as Figma mockups
- [/form-schema](/guide/form-schema-skill): generate new schemas with Claude
- [Schema Reference](/api/schema): full TypeScript types
