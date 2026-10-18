import type { Issue } from '@formhaus/builder';

export function issueText(issue: Issue) {
  return issue.message === 'This step has no fields or text.'
    ? 'Add a field, or give this step a title to show it as a statement.'
    : issue.message;
}
