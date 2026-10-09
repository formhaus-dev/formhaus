import { validateDefinition, type FormDefinition } from '@formhaus/core';
import { firstJsonObject, repairMessage, requestMessage, SCHEMA_URL, SYSTEM_PROMPT, type ChatMessage } from './prompt';
import { complete, type ProviderId } from './providers';

export interface GenerateRequest {
  provider: ProviderId;
  key: string;
  description: string;
  current?: FormDefinition;
  signal?: AbortSignal;
}

export interface Checked {
  definition?: FormDefinition;
  fatal: string[];
  warnings: string[];
}

const FATAL = /^(Invalid route|FormEngine rejects|Duplicate (field key|step id)|Circular show condition)/;

export const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown) => typeof value === 'string' && value.length > 0;

function fieldErrors(fields: unknown, where: string): string[] {
  if (!Array.isArray(fields)) return [`${where} needs a "fields" array.`];
  return fields.flatMap((field, index) =>
    isRecord(field) && text(field.key) && text(field.type) && typeof field.label === 'string' ? [] : [`${where} field ${index + 1} needs "key", "type" and "label".`]);
}

function shapeErrors(value: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const name of ['id', 'title'] as const) if (!text(value[name])) errors.push(`"${name}" must be a non-empty string.`);
  if (!isRecord(value.submit) || typeof value.submit.label !== 'string') errors.push('"submit" must be an object with a "label".');
  if (Array.isArray(value.steps)) {
    value.steps.forEach((step, index) => {
      if (!isRecord(step) || !text(step.id)) errors.push(`Step ${index + 1} needs an "id".`);
      else errors.push(...fieldErrors(step.fields, `Step "${step.id}"`));
    });
  } else if (value.fields !== undefined) errors.push(...fieldErrors(value.fields, 'The form'));
  else errors.push('Add "fields" or "steps".');
  return errors;
}

export function checkReply(reply: string): Checked {
  let value: unknown;
  try {
    value = firstJsonObject(reply);
  } catch (error) {
    return { fatal: [messageOf(error)], warnings: [] };
  }
  if (!isRecord(value)) return { fatal: ['The reply must be a JSON object.'], warnings: [] };
  const fatal = shapeErrors(value);
  if (fatal.length) return { fatal, warnings: [] };
  const definition = { ...value, $schema: SCHEMA_URL } as unknown as FormDefinition;
  let problems: string[];
  try {
    problems = validateDefinition(definition);
  } catch (error) {
    return { fatal: [`The definition could not be read: ${messageOf(error)}`], warnings: [] };
  }
  return { definition, fatal: problems.filter((problem) => FATAL.test(problem)), warnings: problems.filter((problem) => !FATAL.test(problem)) };
}

export interface Generated {
  definition: FormDefinition;
  warnings: string[];
}

export async function generateDefinition(request: GenerateRequest): Promise<Generated> {
  const messages: ChatMessage[] = [requestMessage(request.description, request.current)];
  const results: Checked[] = [];
  for (let round = 0; round < 2; round++) {
    const reply = await complete(request.provider, request.key, SYSTEM_PROMPT, messages, request.signal);
    const result = checkReply(reply);
    results.unshift(result);
    if (!result.fatal.length) break;
    messages.push({ role: 'assistant', content: reply }, repairMessage(result.fatal));
  }
  const best = results.find((result) => result.definition && !result.fatal.length);
  if (!best?.definition) throw new Error(`The generated form is not valid: ${results[0].fatal.join(' ')}`);
  if (request.current) best.definition.id = request.current.id;
  return { definition: best.definition, warnings: best.warnings };
}
