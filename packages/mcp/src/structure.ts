import { isGroup, isSection, type FormDefinition, type FormField, type FormNode, type FormStep } from '@formhaus/core';
import { issue, type Issue } from './issues';
import { CONTAINER_TYPES, FIELD_TYPES } from './vocabulary';

const KNOWN_TYPES = new Set<string>([...FIELD_TYPES, ...CONTAINER_TYPES]);

function fieldIssues(field: Pick<FormField, 'type' | 'autoAdvance'>, path: string, item: boolean): Issue[] {
  const issues: Issue[] = [];
  if (!KNOWN_TYPES.has(field.type)) {
    issues.push(
      issue(
        'custom-field-type',
        'warning',
        `${path}/type`,
        `"${field.type}" is a custom type`,
        'Register a component for it in the renderer, or use a built-in type',
      ),
    );
  }
  if (field.autoAdvance && (field.type !== 'radio' || item)) {
    const problem = item ? 'radio fields inside a group do not advance automatically' : 'only radio fields advance automatically';
    issues.push(
      issue(
        'auto-advance-ignored',
        'warning',
        `${path}/autoAdvance`,
        problem,
        item ? 'Remove autoAdvance' : 'Remove autoAdvance or use a radio field',
      ),
    );
  }
  return issues;
}

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const isNode = (value: unknown): value is FormNode => !!value && typeof value === 'object';

function nodeIssues(nodes: unknown, path: string, item = false): Issue[] {
  return list<unknown>(nodes).flatMap((node, index) => {
    if (!isNode(node)) return [];
    const at = `${path}/${index}`;
    if (isSection(node)) return nodeIssues(node.fields, `${at}/fields`, item);
    return [...fieldIssues(node, at, item), ...(isGroup(node) ? nodeIssues(node.fields, `${at}/fields`, true) : [])];
  });
}

export function advancingRadios(step: FormStep): FormField[] {
  return list<unknown>(step.fields)
    .filter(isNode)
    .flatMap((node) => (isSection(node) ? list<unknown>(node.fields).filter(isNode) : [node]))
    .filter((field): field is FormField => field.type === 'radio' && !!(field as FormField).autoAdvance);
}

export function structureIssues(definition: FormDefinition): Issue[] {
  const fields = list<unknown>(definition.fields);
  const steps = list<FormStep | null>(definition.steps);
  const issues = nodeIssues(fields, '/fields');
  if (!fields.length && !steps.length)
    issues.push(issue('empty-form', 'warning', '', 'the definition has no fields and no steps', 'Add "fields" or "steps"'));
  steps.forEach((step, index) => {
    if (!step || typeof step !== 'object') return;
    issues.push(...nodeIssues(step.fields, `/steps/${index}/fields`));
    if (step.next === false && index < steps.length - 1 && !advancingRadios(step).length) {
      issues.push(
        issue(
          'next-hidden',
          'warning',
          `/steps/${index}/next`,
          'next is false and no autoAdvance radio moves the form forward',
          'Add an autoAdvance radio or remove "next": false',
        ),
      );
    }
  });
  return issues;
}
