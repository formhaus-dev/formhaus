import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cloudRequest } from './cloud-client';
import { result } from './cloud-result';
import { FORM_ID_DESCRIPTION, REVEAL_DESCRIPTION, SETTINGS_DESCRIPTION, WEBHOOK_DESCRIPTION } from './cloud-text';
import { isRecord } from './definition-input';
import { cloudOutput, revealOutput } from './outputs';

export function registerSettingsTool(server: McpServer): void {
  server.registerTool('update_form_settings', {
    title: 'Update form settings',
    description: SETTINGS_DESCRIPTION,
    inputSchema: {
      form_id: z.string().describe(FORM_ID_DESCRIPTION),
      webhook_url: z.string().optional().describe('Public https:// URL that receives each new submission as a signed POST. Empty string removes the webhook. Omit to leave it unchanged.'),
      notify_mode: z.enum(['milestones', 'off']).optional().describe('milestones: an email at the 1st, 10th, 100th, 500th, 1,000th, 5,000th, 10,000th, 25,000th, 50,000th and 100,000th response, without response values. off: no emails. Omit to leave it unchanged.'),
      success_message: z.string().max(500).optional().describe('Text shown after a successful submission on the hosted page and embed. Up to 500 characters. Omit to leave it unchanged.'),
      redirect_url: z.string().optional().describe('http(s) URL the hosted page and embed open after a successful submission. Empty string removes it. Omit to leave it unchanged.'),
      status: z.enum(['active', 'paused']).optional().describe('paused stops accepting submissions, active resumes them. Omit to leave it unchanged.'),
    },
    outputSchema: cloudOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ form_id, ...settings }) => (
    result(await cloudRequest(`/v1/forms/${encodeURIComponent(form_id)}`, { method: 'PATCH', body: settings, auth: 'required' }))
  ));

  server.registerTool('get_webhook', {
    title: 'Get the webhook of a form',
    description: WEBHOOK_DESCRIPTION,
    inputSchema: { form_id: z.string().describe(FORM_ID_DESCRIPTION) },
    outputSchema: cloudOutput,
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ form_id }) => {
    const webhook = await cloudRequest(`/v1/forms/${encodeURIComponent(form_id)}/webhook`, { auth: 'required' });
    if (!webhook.ok || !isRecord(webhook.body)) return result(webhook);
    return result({ ok: true, body: { ...webhook.body, secret: masked(webhook.body.secret) } });
  });

  server.registerTool('reveal_webhook_secret', {
    title: 'Reveal the webhook signing secret',
    description: REVEAL_DESCRIPTION,
    inputSchema: { form_id: z.string().describe(FORM_ID_DESCRIPTION) },
    outputSchema: revealOutput,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ form_id }) => {
    const webhook = await cloudRequest(`/v1/forms/${encodeURIComponent(form_id)}/webhook?reveal=true`, { auth: 'required' });
    if (!webhook.ok || !isRecord(webhook.body)) return result(webhook);
    return result({ ok: true, body: { form_id, webhook_secret: webhook.body.secret } });
  });
}

function masked(secret: unknown): unknown {
  if (typeof secret !== 'string' || secret.includes('…')) return secret;
  return `whsec_…${secret.slice(-4)}`;
}
