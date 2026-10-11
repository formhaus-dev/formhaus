import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiKey, cloudRequest } from './cloud-client';
import { result, withAgentKeyInstructions, withNotice } from './cloud-result';
import { registerSettingsTool } from './cloud-settings-tool';
import { LIST_DESCRIPTION, PUBLISH_DESCRIPTION, SUBMISSIONS_DESCRIPTION } from './cloud-text';
import { definitionInput, parseDefinition } from './definition-input';

export function registerCloudTools(server: McpServer): void {
  server.registerTool('publish_form', {
    title: 'Publish a form',
    description: PUBLISH_DESCRIPTION,
    inputSchema: {
      definition: definitionInput,
      form_id: z.string().optional().describe('Publish a new version of this existing form. Requires FORMHAUS_API_KEY.'),
      email: z.string().optional().describe('Only without an API key: the user email that receives the claim link.'),
      success_message: z.string().max(500).optional().describe('Text shown after a successful submission on the hosted page and embed.'),
      redirect_url: z.string().optional().describe('http(s) URL to open after a successful submission instead of the success message. Empty string removes it.'),
    },
    annotations: { readOnlyHint: false, openWorldHint: true },
  }, async ({ definition, ...rest }) => {
    const parsed = parseDefinition(definition);
    if (!parsed.ok) return result({ ok: false, body: { error: parsed.error } });
    const published = await cloudRequest('/v1/forms', { method: 'POST', body: { ...rest, definition: parsed.value }, auth: 'optional' });
    return withAgentKeyInstructions(published, apiKey() !== undefined);
  });

  server.registerTool('list_forms', {
    title: 'List forms',
    description: LIST_DESCRIPTION,
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async () => result(await cloudRequest('/v1/forms', { auth: 'required' })));

  server.registerTool('get_submissions', {
    title: 'Get form submissions',
    description: SUBMISSIONS_DESCRIPTION,
    inputSchema: {
      form_id: z.string().describe('The form_id returned by publish_form or list_forms.'),
      limit: z.number().int().min(1).max(100).optional().describe('Page size from 1 to 100. Default 50.'),
      cursor: z.string().optional().describe('next_cursor from the previous call. Omit for the newest submissions.'),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ form_id, limit, cursor }) => {
    const query = new URLSearchParams();
    if (limit !== undefined) query.set('limit', String(limit));
    if (cursor !== undefined) query.set('cursor', cursor);
    const suffix = query.size > 0 ? `?${query}` : '';
    return withNotice(await cloudRequest(`/v1/forms/${encodeURIComponent(form_id)}/submissions${suffix}`, { auth: 'required' }));
  });

  registerSettingsTool(server);
}
