import type { ChatMessage } from './prompt';

export type ProviderId = 'anthropic' | 'openai';

interface Reply {
  text: string;
  stop?: 'cut' | 'refused';
}

interface Provider {
  url: string;
  model: string;
  headers(key: string): Record<string, string>;
  body(system: string, messages: ChatMessage[]): unknown;
  read(data: any): Reply;
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-5-5',
    headers: (key) => ({
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    body(system, messages) {
      return { model: this.model, max_tokens: 8192, system, messages };
    },
    read: (data) => ({
      text: (data?.content ?? []).filter((part: any) => part?.type === 'text').map((part: any) => part.text).join(''),
      stop: data?.stop_reason === 'max_tokens' ? 'cut' : data?.stop_reason === 'refusal' ? 'refused' : undefined,
    }),
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-6.1-sol',
    headers: (key) => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` }),
    body(system, messages) {
      return { model: this.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, ...messages] };
    },
    read(data) {
      const choice = data?.choices?.[0];
      const refused = Boolean(choice?.message?.refusal) || choice?.finish_reason === 'content_filter';
      return { text: choice?.message?.content ?? '', stop: refused ? 'refused' : choice?.finish_reason === 'length' ? 'cut' : undefined };
    },
  },
};

const STOPPED = {
  cut: 'The reply was cut off before the form was complete. Try a shorter description or fewer fields.',
  refused: 'The model declined this request. Rephrase the description and try again.',
};

function errorText(response: Response, data: any): string {
  const { status } = response;
  const detail = data?.error?.message;
  if (status === 401 || status === 403) return `Check your API key${detail ? ` (${detail})` : ''}.`;
  if (status === 429 || status === 503 || status === 529) {
    const wait = Number(response.headers.get('retry-after'));
    const when = wait > 0 ? `in ${Math.ceil(wait)} seconds` : 'in a moment';
    return `The provider is busy, try again ${when}${status === 429 && detail ? ` (${detail})` : ''}.`;
  }
  return detail ? `The provider returned an error: ${detail}` : `The provider returned HTTP ${status}.`;
}

export async function complete(id: ProviderId, key: string, system: string, messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  const provider = PROVIDERS[id];
  let response: Response;
  try {
    response = await fetch(provider.url, { method: 'POST', headers: provider.headers(key), body: JSON.stringify(provider.body(system, messages)), signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Could not reach the provider. Check your connection.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorText(response, data));
  const { text, stop } = provider.read(data);
  if (stop) throw new Error(STOPPED[stop]);
  if (!text) throw new Error('The provider returned an empty reply.');
  return text;
}
