export type CodeKind = 'plain' | 'keyword' | 'string' | 'fn' | 'type' | 'attr' | 'number' | 'punct';
export interface CodeToken { kind: CodeKind; text: string }

export const handRolled = {
  total: 194,
  source: `import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

type Values = { name: string; email: string; topic: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+\$/;
const TOPICS = [
  { value: 'question', label: 'General question' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'press', label: 'Press and media' },
  { value: 'other', label: 'Other' },
];

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL.test(values.email)) errors.email = 'Enter a valid email';
  if (!values.message.trim()) errors.message = 'Message is required';
  else if (values.message.length > 2000) errors.message = 'Keep it under 2000 characters';
  return errors;
}

export function ContactForm({ onSubmit }: { onSubmit: (values: Values) => Promise<void> }) {
  const [values, setValues] = useState<Values>({ name: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');`,
};

export const withFormhaus = {
  total: 7,
  source: `import { FormRenderer } from '@formhaus/react';
import '@formhaus/core/style.css';
import definition from './contact-form.json';

export const ContactForm = (props) => (
  <FormRenderer definition={definition} {...props} />
);`,
};

const KEYWORDS = new Set(['import', 'from', 'type', 'const', 'function', 'return', 'if', 'else', 'export', 'async', 'await', 'try', 'catch', 'finally']);
const TOKEN = /('(?:[^'\\]|\\.)*'|`[^`]*`|"[^"]*")|(\/\^.*?\$\/)|(\b\d+\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;

function classify(word: string, rest: string): CodeKind {
  if (KEYWORDS.has(word)) return 'keyword';
  if (/^[A-Z]/.test(word)) return 'type';
  if (rest.startsWith('(')) return 'fn';
  if (rest.startsWith('=') && !rest.startsWith('==')) return 'attr';
  return 'plain';
}

export function highlight(source: string): CodeToken[][] {
  return source.split('\n').map((line) => {
    const tokens: CodeToken[] = [];
    for (const match of line.matchAll(TOKEN)) {
      const [text, string, regex, number, word] = match;
      const rest = line.slice((match.index ?? 0) + text.length);
      if (string || regex) tokens.push({ kind: 'string', text });
      else if (number) tokens.push({ kind: 'number', text });
      else if (word) tokens.push({ kind: classify(word, rest), text });
      else tokens.push({ kind: /\s/.test(text) ? 'plain' : 'punct', text });
    }
    return tokens;
  });
}
