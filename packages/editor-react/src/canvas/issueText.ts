import type { Issue } from '@formhaus/builder';

export function issueText(issue: Issue) {
  return issue.message === 'This step has no fields.' ? 'Add at least one field to this step.' : issue.message;
}
