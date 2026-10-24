import { type FormDefinition, type FormNode, isSection, type MessageFn, type MessageKey } from '@formhaus/core';

const choiceTypes = ['select', 'autocomplete', 'radio', 'multiselect', 'scale', 'rating'];

const lower = (label: string) => label.replace(/\b[A-Z][a-z]+\b/g, (word) => word.toLowerCase());
const subject = (label: string) => {
  const text = lower(label);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const matrixRows = (nodes: FormNode[] = []): string[] =>
  nodes.flatMap((node) =>
    isSection(node) ? (node.layout === 'matrix' ? node.fields.map((row) => row.key) : matrixRows(node.fields)) : [],
  );

const rules: Partial<Record<MessageKey, (params: Record<string, unknown>) => string>> = {
  number: () => 'must be a number',
  minLength: ({ min }) => `must be ${min} characters or more`,
  maxLength: ({ max }) => `must be ${max} characters or less`,
  min: ({ min }) => `must be ${min} or more`,
  max: ({ max }) => `must be ${max} or less`,
  date: () => 'must be a real date',
  time: () => 'must be a real time',
  datetime: () => 'must be a real date and time',
};

function requiredText(type: string, label: string, statement: boolean) {
  if (type === 'file') return 'Select a file';
  if (type === 'checkbox' || type === 'switch') return 'Select the checkbox';
  const verb = choiceTypes.includes(type) ? 'Select' : 'Enter';
  return statement ? `${verb} an answer` : `${verb} ${lower(label)}`;
}

export function govukMessages(definition: FormDefinition): MessageFn | undefined {
  if (definition.lang && !definition.lang.startsWith('en')) return undefined;
  const rows = [...matrixRows(definition.fields), ...(definition.steps ?? []).flatMap((step) => matrixRows(step.fields))];
  return (key, params, field) => {
    if (definition.messages?.[key] || !field.label || params.unit !== undefined) return undefined;
    const label = field.label.trim();
    const statement = rows.includes(field.key) || /[?.:]$/.test(label);
    if (key === 'required') return requiredText(field.type, label, statement);
    if (key === 'email') return 'Enter an email address in the correct format, like name@example.com';
    const rule = rules[key]?.(params);
    return rule && `${statement ? 'The answer' : subject(label)} ${rule}`;
  };
}
