import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiKey, cloudRequest } from './cloud-client';
import { result, withAgentKeyInstructions, withNotice } from './cloud-result';
import { registerSettingsTool } from './cloud-settings-tool';
import { FORM_ID_DESCRIPTION, LIST_DESCRIPTION, PUBLISH_DESCRIPTION, SUBMISSIONS_DESCRIPTION } from './cloud-text';
import { definitionInput, parseDefinition } from './definition-input';
import { cloudOutput } from './outputs';

export function registerCloudTools(server: McpServer): void {
  server.registerTool('publish_form', {
    title: 'Publish a form',
    description: PUBLISH_DESCRIPTION,
    inputSchema: {
      definition: definitionInput,
      form_id: z.string().optional().describe("The 10-character form_id of an existing form, from publish_form or list_forms, to publish a new version of it. Requires an account key (fh_live_...) of the form's account or the agent key (fh_agent_...) that created the form. Omit to create a new form."),
      email: z.string().optional().describe("Only for a new form published without an account key: the user's email. Formhaus emails them claim_url (at most one email per address per hour, no form content). Ignored with a warning otherwise."),
      success_message: z.string().max(500).optional().describe('Text shown after a successful submission on the hosted page and embed. Up to 500 characters.'),
      redirect_url: z.string().optional().describe('http(s) URL the hosted page and embed open after a successful submission instead of the success message. Empty string removes it. Ignored with a warning for unclaimed forms.'),
    },
    outputSchema: cloudOutput,
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
    outputSchema: cloudOutput,
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async () => result(await cloudRequest('/v1/forms', { auth: 'required' })));

  server.registerTool('get_submissions', {
    title: 'Get form submissions',
    description: SUBMISSIONS_DESCRIPTION,
    inputSchema: {
      form_id: z.string().describe(FORM_ID_DESCRIPTION),
      limit: z.number().int().min(1).max(100).optional().describe('Number of submissions per page, a whole number from 1 to 100. Default 50.'),
      cursor: z.string().optional().describe('The next_cursor value from the previous call, to read the next page of older submissions. Omit for the newest submissions.'),
    },
    outputSchema: cloudOutput,
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
