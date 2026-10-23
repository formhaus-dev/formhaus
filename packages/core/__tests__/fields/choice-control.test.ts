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
  const option = (value?: string) => ({ value, closest: () => ({}) });

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
    choice.keyDown(key('ArrowDown'));
    choice.pick('b');
    choice.click({ detail: 0, target: option('b') });
    choice.keyUp(key('ArrowDown'));
    vi.runAllTimers();
    choice.pick('a');
    expect([change.mock.calls, commit.mock.calls]).toEqual([[['b']], [['a']]]);
  });

  it('commits the focused option on Enter, not on a held key', () => {
    const { commit, choice } = setup();
    const held = key('Enter', { value: 'b' }, true);
    choice.keyDown(held);
    choice.keyDown(key('Enter', { value: 'b' }));
    expect([commit.mock.calls, held.preventDefault.mock.calls.length]).toEqual([[['b']], 1]);
  });

  it('commits the focused option on Space key up and blocks the native toggle', () => {
    const { commit, choice } = setup({}, 'a');
    const down = key(' ', { value: 'b' });
    choice.keyDown(down);
    expect(commit).not.toHaveBeenCalled();
    const up = key(' ', { value: 'b' });
    choice.keyUp(up);
    choice.keyUp(key(' ', {}));
    expect([commit.mock.calls, down.preventDefault.mock.calls.length, up.preventDefault.mock.calls.length]).toEqual([[['b'], ['a']], 1, 1]);
  });

  it('commits a click on the picked option and nothing else', () => {
    const { commit, choice } = setup({}, 'a');
    for (const click of [
      { detail: 1, target: option('a') },
      { detail: 1, target: option('b') },
      { detail: 2, target: option() },
      { detail: 1, target: { closest: () => null } },
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
    select.choice.keyDown(key('Enter', { value: 'a' }));
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
