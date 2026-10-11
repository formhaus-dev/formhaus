const mcpUrl = 'https://api.formhaus.dev/mcp'

export const templateJsonUrl = (slug: string) => `https://formhaus.dev/templates/${slug}.json`

export function templatePrompt(title: string, slug: string): string {
  return [
    `Set up the "${title}" form for my business, starting from the Formhaus template.`,
    '',
    `Template: ${templateJsonUrl(slug)}`,
    '',
    '1. Adapt the wording, fields and options to my business. If anything is unclear, ask me first.',
    '2. Publish it with the Formhaus MCP server, or embed it in my app with @formhaus/react or @formhaus/vue.',
    `   Claude Code: claude mcp add --transport http formhaus ${mcpUrl}`,
    `   Other MCP clients: add ${mcpUrl} as an HTTP MCP server.`,
    '',
    'Formhaus docs for agents: https://formhaus.dev/llms.txt',
  ].join('\n')
}
