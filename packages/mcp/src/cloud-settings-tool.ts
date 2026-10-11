import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cloudRequest } from './cloud-client';
import { result } from './cloud-result';
import { SETTINGS_DESCRIPTION } from './cloud-text';
import { isRecord } from './definition-input';

export function registerSettingsTool(server: McpServer): void {
  server.registerTool('update_form_settings', {
    title: 'Update form settings',
    description: SETTINGS_DESCRIPTION,
    inputSchema: {
      form_id: z.string().describe('The form_id returned by publish_form or list_forms.'),
      webhook_url: z.string().optional().describe('Public https:// URL for submission webhooks. Empty string removes it.'),
      notify_email: z.boolean().optional().describe('Deprecated: true means notify_mode milestones, false means off.'),
      notify_mode: z.enum(['milestones', 'off']).optional().describe('milestones: an email at the 1st, 10th, 100th, 500th, 1,000th, 5,000th, 10,000th, 25,000th, 50,000th and 100,000th response, without response values. off: no emails.'),
      success_message: z.string().max(500).optional().describe('Text shown after a successful submission. Up to 500 characters.'),
      redirect_url: z.string().optional().describe('http(s) URL to open after a successful submission. Empty string removes it.'),
      status: z.enum(['active', 'paused']).optional().describe('active or paused.'),
      reveal_secret: z.boolean().optional().describe('true returns the full webhook signing secret (whsec_...) instead of a masked one. Only when a webhook_url is set.'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ form_id, reveal_secret, ...settings }) => {
    const path = `/v1/forms/${encodeURIComponent(form_id)}`;
    const updated = await cloudRequest(path, { method: 'PATCH', body: settings, auth: 'required' });
    if (!updated.ok || !reveal_secret || !isRecord(updated.body) || !updated.body.webhook_url) return result(updated);
    const webhook = await cloudRequest(`${path}/webhook?reveal=true`, { auth: 'required' });
    if (!webhook.ok || !isRecord(webhook.body)) return result(webhook);
    return result({ ok: true, body: { ...updated.body, webhook_secret: webhook.body.secret } });
  });
}
