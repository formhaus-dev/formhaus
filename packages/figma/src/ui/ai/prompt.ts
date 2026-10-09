import type { FormDefinition } from '@formhaus/core';

export const SCHEMA_URL = 'https://formhaus.dev/schema/form-definition.json';

export const SYSTEM_PROMPT = [
  'You write Formhaus form definitions. Reply with one JSON object and nothing else: no prose, no Markdown fences.',
  'Shape: { "$schema": "' + SCHEMA_URL + '", "id", "title", "submit": { "label" }, and either "fields" (one screen) or "steps" (several screens), never both }.',
  'Field: { "key", "type", "label", "placeholder"?, "helperText"?, "defaultValue"?, "options"?, "rows"?, "accept"?, "inputMode"?, "validation"?, "show"?, "showAny"?, "autoAdvance"? }.',
  'Field types: text, email, phone, number, password, select, autocomplete, multiselect, checkbox, radio, switch, file, date, datetime, textarea. Use no other types.',
  'Keys and ids are unique camelCase. select, autocomplete, multiselect and radio need "options": [{ "value", "label" }] with camelCase or lowercase values.',
  'validation: required (true or a message), minLength, maxLength, min, max, pattern (regex string), matchField (key of another field), each with an optional <rule>Message.',
  'Conditions: "show" is AND, "showAny" is OR, each a list of { "field": <key>, one of "eq" | "neq" | "in" | "notIn" | "notEmpty": true }. Conditions only reference other fields, never the field itself, without cycles.',
  'Step: { "id", "title", "description"?, "fields", "show"?, "showAny"?, "routes"?, "next"?: { "label" } | false, "back"?: { "label" } | false, "skip"?: { "label" } }.',
  'Routes branch forward: "routes": [{ "to": <later step id> | null, "show"?, "showAny"? }]. The first matching route wins, so put the unconditional fallback last. to: null ends the path. Route conditions reference fields of this or earlier steps only. Branches that should not fall into each other need their own route to the step where they meet.',
  'Keep labels short and in the language of the request. Use steps only when the request asks for several screens or the form is long.',
].join('\n');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function requestMessage(description: string, current?: FormDefinition): ChatMessage {
  if (!current) return { role: 'user', content: `Create this form:\n${description.trim()}` };
  return {
    role: 'user',
    content: `Here is the current form:\n${JSON.stringify(current)}\n\nChange it as follows and return the whole updated form. Keep the id and every key that does not need to change.\n${description.trim()}`,
  };
}

export function repairMessage(errors: string[]): ChatMessage {
  return {
    role: 'user',
    content: `That definition has problems:\n${errors.map((error) => `- ${error}`).join('\n')}\nReturn the corrected JSON object only.`,
  };
}

export function firstJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  if (start < 0) throw new Error('The reply has no JSON object.');
  let depth = 0;
  let inString = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (char === '\\') index++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new Error('The reply has an unfinished JSON object.');
}
