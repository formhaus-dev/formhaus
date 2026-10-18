import type { FormEvent } from '@formhaus/core';

export function questionTimer(report: (stepId: string, ms: number) => void, now = () => performance.now()) {
  let stepId: string | undefined;
  let since: number | undefined;
  const lap = () => {
    if (stepId !== undefined && since !== undefined) report(stepId, now() - since);
    since = undefined;
  };
  return (event: FormEvent) => {
    if (event.type === 'step_viewed') {
      lap();
      stepId = event.stepId;
      since = now();
    } else if (event.type === 'form_submitted' || event.type === 'form_reset') {
      lap();
    } else if (event.type === 'form_submit_failed') {
      since = now();
    }
  };
}
