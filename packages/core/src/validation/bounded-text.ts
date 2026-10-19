export const MAX_STRING_LENGTH = 10000;

export function cut(text: string): string {
  if (text.length <= MAX_STRING_LENGTH) return text;
  const code = text.charCodeAt(MAX_STRING_LENGTH - 1);
  return text.slice(0, code >= 0xd800 && code <= 0xdbff ? MAX_STRING_LENGTH - 1 : MAX_STRING_LENGTH);
}

export function fill(text: string, pattern: RegExp, replace: (match: RegExpExecArray) => string): string {
  let result = '';
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (result.length > MAX_STRING_LENGTH) break;
    result += text.slice(last, match.index) + replace(match).slice(0, MAX_STRING_LENGTH + 1);
    last = match.index + match[0].length;
  }
  return cut(result + text.slice(last));
}
