import type { FormEvent } from '@formhaus/core';

export interface QuestionTime {
  stepId: string;
  fieldKey?: string;
  ms: number;
}

function stopwatch(now: () => number) {
  let spent = 0;
  let since: number | undefined;
  return {
    start() {
      since ??= now();
    },
    pause() {
      if (since !== undefined) spent += now() - since;
      since = undefined;
    },
    take() {
      this.pause();
      const ms = spent;
      spent = 0;
      return ms;
    },
  };
}

export function questionTimer(report: (time: QuestionTime) => void, now = () => performance.now()) {
  const step = stopwatch(now);
  const field = stopwatch(now);
  let stepId: string | undefined;
  let fieldKey: string | undefined;
  let active = false;
  let hidden = false;

  const finishField = () => {
    const ms = field.take();
    if (stepId && fieldKey) report({ stepId, fieldKey, ms });
    fieldKey = undefined;
  };
  const finishStep = () => {
    if (fieldKey) finishField();
    const ms = step.take();
    if (stepId && ms > 0) report({ stepId, ms });
    active = false;
  };
  const resume = () => {
    active = true;
    if (!hidden) step.start();
  };

  return {
    onEvent(event: FormEvent) {
      if (event.type === 'form_viewed') {
        step.take();
        field.take();
        stepId = fieldKey = undefined;
        active = false;
      } else if (event.type === 'step_viewed') {
        finishStep();
        stepId = event.stepId;
        resume();
      } else if (event.type === 'field_focused') {
        fieldKey = event.fieldKey;
        if (!hidden) field.start();
      } else if (event.type === 'field_blurred' && event.fieldKey === fieldKey) {
        finishField();
      } else if (event.type === 'form_submitted' || event.type === 'form_reset') {
        finishStep();
      } else if (event.type === 'form_submit_failed') {
        resume();
      }
    },
    hide() {
      hidden = true;
      step.pause();
      field.pause();
    },
    show() {
      hidden = false;
      if (active) step.start();
      if (fieldKey) field.start();
    },
    leave() {
      finishStep();
      stepId = undefined;
    },
  };
}

export type QuestionTimer = ReturnType<typeof questionTimer>;

export function watchPage(timer: QuestionTimer, page: Document = document, view: Window = window) {
  const visibility = () => (page.visibilityState === 'hidden' ? timer.hide() : timer.show());
  const leave = () => timer.leave();
  visibility();
  page.addEventListener('visibilitychange', visibility);
  view.addEventListener('pagehide', leave);
  return () => {
    page.removeEventListener('visibilitychange', visibility);
    view.removeEventListener('pagehide', leave);
  };
}
