import type { FieldOption, FormField, FormSection } from '@formhaus/core';
import { issue, type Issue } from './issues';
import { IMAGE_FIELD_TYPES, MATRIX_ROW_TYPES, SCALE_FIELD_TYPES } from './vocabulary';

const MAX_ANCHORS = 3;
const MAX_COLUMNS = 7;

const has = (list: readonly string[], type: unknown) => typeof type === 'string' && list.includes(type);
const options = (field: Partial<FormField>): Partial<FieldOption>[] =>
  Array.isArray(field.options) ? field.options.filter((option) => !!option && typeof option === 'object') : [];
const whole = (value: unknown): value is number => Number.isInteger(value);

function rangeIssues(field: FormField, path: string): Issue[] {
  const rules = field.validation ?? {};
  const max = rules.max ?? 5;
  const at = (rule: string) => `${path}/validation/${rule}`;
  if (field.type === 'rating') {
    const issues: Issue[] = [];
    if (!whole(max) || max < 3 || max > 10)
      issues.push(issue('scale-range', 'warning', at('max'), `the rating "${field.key}" has ${max} stars`, 'Use a max from 3 to 10'));
    const min = rules.min;
    if (min !== undefined && (!whole(min) || min < 1 || (whole(max) && min > max)))
      issues.push(
        issue(
          'rating-min',
          'warning',
          at('min'),
          whole(min) && min > max
            ? `no rating of "${field.key}" reaches the minimum of ${min} stars`
            : `the minimum of the rating "${field.key}" is not a whole number of stars`,
          `Use a min from 1 to ${whole(max) ? max : 'max'}, or remove it`,
        ),
      );
    return issues;
  }
  const min = rules.min ?? 1;
  if (!whole(min) || (min !== 0 && min !== 1))
    return [issue('scale-range', 'warning', at('min'), `the scale "${field.key}" starts at ${min}`, 'Start the scale at 0 or 1')];
  if (whole(max) && max - min >= 2 && max - min <= 10) return [];
  const problem =
    whole(max) && max <= min
      ? `the scale "${field.key}" ends at ${max}, so no value is in range`
      : `the scale "${field.key}" runs from ${min} to ${max}`;
  return [issue('scale-range', 'warning', at('max'), problem, `Use a whole max from ${min + 2} to ${min + 10}`)];
}

function anchorIssues(field: FormField, path: string): Issue[] {
  const list = options(field);
  const rules = field.validation ?? {};
  const [min, max] = [field.type === 'rating' ? 1 : (rules.min ?? 1), rules.max ?? 5];
  const issues = list.flatMap((option, index) => {
    const point = Number(option.value);
    if (String(option.value) === String(point) && whole(point) && point >= min && point <= max) return [];
    return [
      issue(
        'anchor-out-of-range',
        'warning',
        `${path}/options/${index}/value`,
        `the anchor ${JSON.stringify(option.value)} of "${field.key}" is not a point from ${min} to ${max}`,
        'Set the anchor value to a point number as a string, such as "1"',
      ),
    ];
  });
  if (list.length > MAX_ANCHORS)
    issues.push(
      issue(
        'too-many-anchors',
        'warning',
        `${path}/options`,
        `"${field.key}" has ${list.length} anchors; only the first, middle and last are shown`,
        'Keep at most 3 anchors: start, middle and end',
      ),
    );
  return issues;
}

function imageIssues(field: FormField, path: string): Issue[] {
  if (has(IMAGE_FIELD_TYPES, field.type)) return [];
  return options(field).flatMap((option, index) =>
    option.image === undefined
      ? []
      : [
          issue(
            'image-not-applicable',
            'warning',
            `${path}/options/${index}/image`,
            `${field.type} fields do not show option images`,
            'Use a radio or multiselect field, or remove "image"',
          ),
        ],
  );
}

export function questionIssues(field: FormField, path: string): Issue[] {
  const scale = has(SCALE_FIELD_TYPES, field.type) ? [...rangeIssues(field, path), ...anchorIssues(field, path)] : [];
  return [...scale, ...imageIssues(field, path)];
}

const signature = (field: Partial<FormField>) =>
  JSON.stringify(options(field).map(({ value, label, image }) => [value, label, image ?? null]));

export function matrixIssues(section: FormSection, path: string): Issue[] {
  if (section.layout !== 'matrix') return [];
  const rows = (Array.isArray(section.fields) ? section.fields : []).map((node, index) => ({
    node: node as Partial<FormField>,
    at: `${path}/fields/${index}`,
  }));
  const issues: Issue[] = rows
    .filter(({ node }) => node.type !== 'hidden' && !has(MATRIX_ROW_TYPES, node.type))
    .map(({ node, at }) =>
      issue(
        'matrix-row-type',
        'warning',
        `${at}/type`,
        `"${node.key}" is a ${node.type} field, so the matrix "${section.key}" renders it as a plain field`,
        'Use radio or multiselect fields in a matrix section',
      ),
    );
  const choices = rows.filter(({ node }) => has(MATRIX_ROW_TYPES, node.type));
  const first = choices[0];
  if (!first) return issues;
  for (const { node, at } of choices.slice(1)) {
    if (signature(node) === signature(first.node)) continue;
    issues.push(
      issue(
        'matrix-options-mismatch',
        'warning',
        `${at}/options`,
        `the options of "${node.key}" differ from the column headers of the matrix "${section.key}"`,
        `Copy the options of "${first.node.key}"`,
      ),
    );
  }
  const columns = options(first.node).length;
  if (columns > MAX_COLUMNS)
    issues.push(
      issue(
        'matrix-too-wide',
        'warning',
        `${first.at}/options`,
        `the matrix "${section.key}" has ${columns} columns, which crowd small screens`,
        `Use at most ${MAX_COLUMNS} columns, or a scale field per row`,
      ),
    );
  return issues;
}
