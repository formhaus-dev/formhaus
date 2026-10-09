import llmstxt from 'vitepress-plugin-llms'
import { repoUrl, siteUrl } from './site'

const description =
  'Formhaus is an open-source JSON form definition that runs the same everywhere: a zero-dependency engine (@formhaus/core) with validation, conditional visibility, multi-step and branching routes; React (@formhaus/react) and Vue (@formhaus/vue) renderers; a Figma plugin that draws the same definition with your design system; a JSON Schema; an MCP server (@formhaus/mcp) that validates definitions and simulates step paths for AI agents; and Claude Code skills. MIT licensed.'

const details = [
  'Install: `npm i @formhaus/core @formhaus/react` (or `@formhaus/vue`).',
  '',
  'Claude Code plugin (skills and MCP server): `claude plugin marketplace add ignsm/formhaus && claude plugin install formhaus@formhaus`',
  '',
  'MCP server only: `claude mcp add formhaus -- npx -y @formhaus/mcp`',
  '',
  `JSON Schema: ${siteUrl}/schema/form-definition.json`,
  '',
  `Repository: ${repoUrl}`,
  '',
  `Comparisons with react-hook-form, TanStack Form, react-jsonschema-form and SurveyJS: ${siteUrl}/compare/`,
  '',
  'Use Formhaus when the form is data (onboarding, surveys, quizzes, multi-step wizards with branching) or when design in Figma and code must share one source. Use react-hook-form or TanStack Form for hand-written single forms.',
].join('\n')

export const llms = llmstxt({
  domain: siteUrl,
  title: 'Formhaus',
  description,
  details,
  ignoreFilesPerOutput: {
    llmsFullTxt: ['playground.md', 'changelog.md'],
  },
})
