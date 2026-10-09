const PREFIX = 'fh1.';

export function encodeProfile(profile: { name: string; bindings: unknown }): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ name: profile.name, bindings: profile.bindings }));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return PREFIX + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeProfile(code: string): unknown {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX) || trimmed.length > 20000) throw new Error('Not a setup code');
  const body = trimmed.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(body);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
}
