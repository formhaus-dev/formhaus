export type AiProvider = 'anthropic' | 'openai';

export interface AiSettings {
  provider: AiProvider;
  keys: Partial<Record<AiProvider, string>>;
}

export interface AiMessage {
  type: string;
  provider?: AiProvider;
  key?: string;
}

const STORAGE_KEY = 'formhaus.ai';
const PROVIDERS: AiProvider[] = ['anthropic', 'openai'];
const MESSAGES = new Set(['getAiSettings', 'saveAiKey', 'forgetAiKey']);

export function isAiMessage(type: string): boolean {
  return MESSAGES.has(type);
}

async function readSettings(): Promise<AiSettings> {
  const stored = (await figma.clientStorage.getAsync(STORAGE_KEY).catch(() => undefined)) as Partial<AiSettings> | undefined;
  const provider = PROVIDERS.includes(stored?.provider as AiProvider) ? stored!.provider! : 'anthropic';
  return { provider, keys: { ...stored?.keys } };
}

export async function runAiMessage(message: AiMessage): Promise<AiSettings & { type: 'aiSettings' }> {
  const settings = await readSettings();
  const provider = message.provider && PROVIDERS.includes(message.provider) ? message.provider : null;
  if (provider && message.type !== 'getAiSettings') {
    settings.provider = provider;
    const key = message.type === 'saveAiKey' ? message.key?.trim() : '';
    if (key) settings.keys[provider] = key;
    else delete settings.keys[provider];
    await figma.clientStorage.setAsync(STORAGE_KEY, settings);
  }
  return { type: 'aiSettings', ...settings };
}
