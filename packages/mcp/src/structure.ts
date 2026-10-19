import { isGroup, isSection, type FormDefinition, type FormField, type FormNode, type FormStep } from '@formhaus/core';
import { issue, type Issue } from './issues';
import { matrixIssues, questionIssues } from './question-lint';
import { AUTO_ADVANCE_TYPES, CONTAINER_TYPES, FIELD_TYPES } from './vocabulary';

const KNOWN_TYPES = new Set<string>([...FIELD_TYPES, ...CONTAINER_TYPES]);
const ADVANCING = new Set<string>(AUTO_ADVANCE_TYPES);

type Place = 'step' | 'group' | 'matrix';

const IGNORED: Record<Place, [string, string]> = {
  step: ['only radio, scale and rating fields advance automatically', 'Remove autoAdvance or use a radio, scale or rating field'],
  group: ['fields inside a group do not advance automatically', 'Remove autoAdvance'],
  matrix: ['rows of a matrix section do not advance automatically', 'Remove autoAdvance'],
};

function fieldIssues(field: FormField, path: string, place: Place): Issue[] {
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
  if (field.autoAdvance && (!ADVANCING.has(field.type) || place !== 'step')) {
    const [problem, hint] = IGNORED[ADVANCING.has(field.type) ? place : 'step'];
    issues.push(issue('auto-advance-ignored', 'warning', `${path}/autoAdvance`, problem, hint));
  }
  return [...issues, ...questionIssues(field, path)];
}

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const isNode = (value: unknown): value is FormNode => !!value && typeof value === 'object';

function nodeIssues(nodes: unknown, path: string, place: Place = 'step'): Issue[] {
  return list<unknown>(nodes).flatMap((node, index) => {
    const at = `${path}/${index}`;
    if (!isNode(node)) return [];
    if (isSection(node))
      return [
        ...matrixIssues(node, at),
        ...nodeIssues(node.fields, `${at}/fields`, node.layout === 'matrix' && place === 'step' ? 'matrix' : place),
      ];
    return [...fieldIssues(node as FormField, at, place), ...(isGroup(node) ? nodeIssues(node.fields, `${at}/fields`, 'group') : [])];
  });
}

export function advancingFields(step: FormStep): FormField[] {
  return list<unknown>(step.fields)
    .filter(isNode)
    .flatMap((node) => (isSection(node) ? (node.layout === 'matrix' ? [] : list<unknown>(node.fields).filter(isNode)) : [node]))
    .filter((field): field is FormField => ADVANCING.has(field.type) && !!(field as FormField).autoAdvance);
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
    if (step.next === false && index < steps.length - 1 && !advancingFields(step).length) {
      issues.push(
        issue(
          'next-hidden',
          'warning',
          `/steps/${index}/next`,
          'next is false and no autoAdvance radio, scale or rating moves the form forward',
          'Add an autoAdvance radio, scale or rating, or remove "next": false',
        ),
      );
    }
  });
  return issues;
}
