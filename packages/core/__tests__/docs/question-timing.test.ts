import { describe, expect, it } from 'vitest';
import definition from '../../../../docs/recipes/definitions/survey.json';
import { type QuestionTime, questionTimer, watchPage } from '../../../../docs/recipes/snippets/question-timing';
import type { FormDefinition } from '../../src';
import { FormEngine } from '../../src/engine';

function setup() {
  const clock = { now: 0 };
  const times: QuestionTime[] = [];
  const timer = questionTimer(
    (time) => times.push(time),
    () => clock.now,
  );
  const mount = () => {
    const engine = new FormEngine(definition as FormDefinition, {}, { onFormEvent: timer.onEvent });
    engine.start();
    return engine;
  };
  return { clock, times, timer, mount };
}

function fakePage() {
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const view = new EventTarget();
  const setVisibility = (state: 'visible' | 'hidden') => {
    page.visibilityState = state;
    page.dispatchEvent(new Event('visibilitychange'));
  };
  const leavePage = () => view.dispatchEvent(new Event('pagehide'));
  return { page: page as unknown as Document, view: view as unknown as Window, setVisibility, leavePage };
}

describe('question timing recipe', () => {
  it('measures each question, its fields and a retried submit', async () => {
    const { clock, times, timer, mount } = setup();
    const engine = mount();
    clock.now = 1200;
    engine.setValue('role', 'designer');
    await engine.next();
    timer.onEvent({ type: 'field_focused', fieldKey: 'team' });
    clock.now = 3000;
    engine.setValue('team', 4);
    timer.onEvent({ type: 'field_blurred', fieldKey: 'team', hasValue: true });
    clock.now = 4000;
    await engine.next();
    clock.now = 9000;
    await engine.submit(() => ({ ok: false, formErrors: ['Try again'] }));
    clock.now = 9500;
    await engine.submit(() => {});
    expect(times).toEqual([
      { stepId: 'role', ms: 1200 },
      { stepId: 'team', fieldKey: 'team', ms: 1800 },
      { stepId: 'team', ms: 2800 },
      { stepId: 'feedback', ms: 5000 },
      { stepId: 'feedback', ms: 500 },
    ]);
  });

  it('starts over on a remount', () => {
    const { clock, times, timer, mount } = setup();
    mount();
    clock.now = 5000;
    mount();
    clock.now = 6000;
    timer.leave();
    expect(times).toEqual([{ stepId: 'role', ms: 1000 }]);
  });

  it('pauses while the tab is hidden', () => {
    const { clock, times, timer, mount } = setup();
    const { page, view, setVisibility } = fakePage();
    const stop = watchPage(timer, page, view);
    mount();
    clock.now = 1000;
    setVisibility('hidden');
    clock.now = 60000;
    setVisibility('visible');
    clock.now = 61000;
    timer.leave();
    stop();
    expect(times).toEqual([{ stepId: 'role', ms: 2000 }]);
  });

  it('reports an abandoned question on pagehide', async () => {
    const { clock, times, timer, mount } = setup();
    const { page, view, leavePage } = fakePage();
    const stop = watchPage(timer, page, view);
    const engine = mount();
    engine.setValue('role', 'engineer');
    clock.now = 700;
    await engine.next();
    clock.now = 2700;
    leavePage();
    stop();
    expect(times).toEqual([
      { stepId: 'role', ms: 700 },
      { stepId: 'team', ms: 2000 },
    ]);
  });
});
