import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormField } from '../../src';
import { choiceControl, warnDoubleLabel } from '../../src/controls';

const field = (type: string, overrides: Partial<FormField> = {}): FormField => ({ key: type, type, label: type, ...overrides });

describe('choiceControl', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (overrides: Partial<FormField> = {}, value: unknown = null) => {
    const change = vi.fn();
    const commit = vi.fn();
    const radio = field('radio', {
      autoAdvance: true,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      ...overrides,
    });
    const choice = choiceControl(() => ({ field: radio, value, options: radio.options ?? [], disabled: false }), change, commit);
    return { change, commit, choice };
  };
  const key = (name: string, target: unknown = {}, repeat = false) => ({ key: name, repeat, target, preventDefault: vi.fn() });
  const option = (value?: string) => {
    const element = { value, closest: () => element };
    return element;
  };
  type Choice = ReturnType<typeof choiceControl>;
  const down = (choice: Choice, event: ReturnType<typeof key>, during?: () => void) => {
    choice.keyDownCapture(event);
    during?.();
    choice.keyDown(event);
  };

  it('ignores Enter and clicks from a nested field inside its root', () => {
    const { commit, choice } = setup({}, 'a');
    const reveal = {};
    const root = { contains: (node: unknown) => node === reveal };
    const nested = { value: 'a', closest: (selector: string) => (selector.includes('reveal') ? reveal : nested) };
    down(choice, { ...key('Enter', nested), currentTarget: root });
    choice.click({ detail: 1, target: nested, currentTarget: root });
    vi.runAllTimers();
    const own = { value: 'a', closest: (selector: string) => (selector.includes('reveal') ? null : own) };
    choice.click({ detail: 1, target: own, currentTarget: root });
    vi.runAllTimers();
    expect(commit.mock.calls).toEqual([['a']]);
  });

  it('commits from an option whose id merely looks like a reveal block', () => {
    const { commit, choice } = setup({}, 'a');
    const root = { contains: () => true };
    const own = { value: 'a', closest: (selector: string) => (selector === '[data-fh="reveal"]' ? null : own) };
    choice.click({ detail: 1, target: own, currentTarget: root });
    vi.runAllTimers();
    expect(commit.mock.calls).toEqual([['a']]);
  });

  it('changes without autoAdvance and commits with it', () => {
    const plain = setup({ autoAdvance: false });
    plain.choice.pick('a');
    expect([plain.change.mock.calls, plain.commit.mock.calls]).toEqual([[['a']], []]);
    const auto = setup();
    auto.choice.pick('a');
    expect([auto.change.mock.calls, auto.commit.mock.calls]).toEqual([[], [['a']]]);
  });

  it('only changes after an arrow key until the key is released', () => {
    const { change, commit, choice } = setup();
    down(choice, key('ArrowDown'), () => choice.pick('b'));
    choice.click({ detail: 0, target: option('b') });
    choice.keyUp(key('ArrowDown'));
    vi.runAllTimers();
    choice.pick('a');
    expect([change.mock.calls, commit.mock.calls]).toEqual([[['b']], [['a']]]);
  });

  it('commits the focused option on Enter, not on a held key', () => {
    const { commit, choice } = setup();
    const held = key('Enter', option('b'), true);
    down(choice, held);
    down(choice, key('Enter', option('b')));
    expect([commit.mock.calls, held.preventDefault.mock.calls.length]).toEqual([[['b']], 1]);
  });

  it('commits the focused option on Space key up and blocks the native toggle', () => {
    const { commit, choice } = setup({}, 'a');
    const pressed = key(' ', option('b'));
    down(choice, pressed);
    expect(commit).not.toHaveBeenCalled();
    const up = key(' ', option('b'));
    choice.keyUp(up);
    choice.keyUp(key(' ', option()));
    down(choice, key(' ', option()));
    choice.keyUp(key(' ', option()));
    expect([commit.mock.calls, pressed.preventDefault.mock.calls.length, up.preventDefault.mock.calls.length]).toEqual([
      [['b'], ['a']],
      1,
      1,
    ]);
  });

  it('commits a held Space once on release', () => {
    const { commit, choice } = setup();
    down(choice, key(' ', option('b')));
    down(choice, key(' ', option('b'), true));
    choice.keyUp(key(' ', option('b')));
    expect(commit.mock.calls).toEqual([['b']]);
  });

  it('leaves keys on elements that are not options alone', () => {
    const { commit, choice } = setup({}, 'a');
    const outside = { value: 'typed', closest: () => null };
    const space = key(' ', outside);
    const enter = key('Enter', outside);
    down(choice, space);
    choice.keyUp(key(' ', outside));
    down(choice, enter);
    expect([commit.mock.calls, space.preventDefault.mock.calls.length, enter.preventDefault.mock.calls.length]).toEqual([[], 0, 0]);
  });

  it('treats Home and End like arrow keys', () => {
    const { change, commit, choice } = setup();
    down(choice, key('Home', option('a')), () => choice.pick('a'));
    choice.keyUp(key('Home', option('a')));
    down(choice, key('End', option('b')), () => choice.pick('b'));
    expect([change.mock.calls, commit.mock.calls]).toEqual([[['a'], ['b']], []]);
  });

  it('commits once when the control selects on its own key down', () => {
    const { commit, choice } = setup();
    down(choice, key(' ', option('a')), () => choice.pick('a'));
    choice.keyUp(key(' ', option('a')));
    down(choice, key('Enter', option('b')), () => choice.pick('b'));
    choice.keyUp(key('Enter', option('b')));
    expect(commit.mock.calls).toEqual([['a'], ['b']]);
  });

  it('commits a click on the picked option and nothing else', () => {
    const { commit, choice } = setup({}, 'a');
    for (const click of [
      { detail: 1, target: option('a') },
      { detail: 1, target: option('b') },
      { detail: 2, target: option() },
      { detail: 1, target: { closest: () => null } },
      { detail: 1, target: { value: '', closest: () => null } },
    ]) {
      choice.click(click);
      vi.runAllTimers();
    }
    expect(commit.mock.calls).toEqual([['a']]);
  });

  it('commits once when the control changes before or after the click', () => {
    const before = setup({}, 'a');
    before.choice.pick('b');
    before.choice.click({ detail: 1, target: option() });
    vi.runAllTimers();
    const after = setup({}, 'a');
    after.choice.click({ detail: 1, target: option() });
    after.choice.pick('b');
    vi.runAllTimers();
    expect([before.commit.mock.calls, after.commit.mock.calls]).toEqual([[['b']], [['b']]]);
  });

  it('ignores types without autoAdvance support and empty picks', () => {
    const select = setup({ type: 'select' });
    select.choice.pick('a');
    down(select.choice, key('Enter', option('a')));
    const empty = setup();
    empty.choice.pick(null);
    vi.runAllTimers();
    expect([select.commit.mock.calls, select.change.mock.calls, empty.commit.mock.calls]).toEqual([[], [['a']], []]);
  });

  it('stops a pending commit', () => {
    const { commit, choice } = setup({}, 'a');
    choice.click({ detail: 1, target: option('a') });
    choice.stop();
    vi.runAllTimers();
    expect(commit).not.toHaveBeenCalled();
  });
});

describe('warnDoubleLabel', () => {
  it('warns when two labels point at one control', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const labels = (...ids: string[]) => ({ getElementsByTagName: () => ids.map((htmlFor) => ({ htmlFor })) });
    warnDoubleLabel(labels('a', 'b'), 'a');
    expect(warn).not.toHaveBeenCalled();
    warnDoubleLabel(labels('a', 'a'), 'a');
    expect(String(warn.mock.calls[0][0])).toContain('double-label');
    warn.mockRestore();
  });
});
