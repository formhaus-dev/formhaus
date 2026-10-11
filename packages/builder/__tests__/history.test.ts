import { describe, expect, it } from 'vitest';
import { createHistory, isUndoKey } from '../src';

function clock() {
  let time = 0;
  return { now: () => time, tick: (ms: number) => (time += ms) };
}

describe('createHistory', () => {
  it('undoes and redoes', () => {
    const history = createHistory(0);
    history.push(1);
    history.push(2);
    expect(history.undo()).toBe(1);
    expect(history.undo()).toBe(0);
    expect(history.undo()).toBeUndefined();
    expect(history.redo()).toBe(1);
    expect(history.canRedo).toBe(true);
    history.push(5);
    expect(history.canRedo).toBe(false);
  });

  it('coalesces pushes of one group inside the window', () => {
    const time = clock();
    const history = createHistory('', { now: time.now });
    history.push('a', 'b1:label');
    time.tick(100);
    history.push('ab', 'b1:label');
    time.tick(100);
    history.push('abc', 'b1:label');
    expect(history.undo()).toBe('');
    history.push('x', 'b1:label');
    time.tick(400);
    history.push('xy', 'b1:label');
    expect(history.undo()).toBe('x');
  });

  it('starts a new entry after seal or another group', () => {
    const history = createHistory(0, { now: () => 0 });
    history.push(1, 'a');
    history.seal();
    history.push(2, 'a');
    history.push(3, 'b');
    expect([history.undo(), history.undo(), history.undo()]).toEqual([2, 1, 0]);
  });

  it('keeps at most the limit', () => {
    const history = createHistory(0, { limit: 3 });
    for (let value = 1; value <= 10; value++) history.push(value);
    const undone = [history.undo(), history.undo(), history.undo(), history.undo()];
    expect(undone).toEqual([9, 8, 7, undefined]);
  });

  it('maps keyboard shortcuts', () => {
    const base = { metaKey: true, ctrlKey: false, shiftKey: false };
    expect(isUndoKey({ ...base, key: 'z' })).toBe('undo');
    expect(isUndoKey({ ...base, key: 'Z', shiftKey: true })).toBe('redo');
    expect(isUndoKey({ ...base, metaKey: false, ctrlKey: true, key: 'y' })).toBe('redo');
    expect(isUndoKey({ ...base, metaKey: false, key: 'z' })).toBeUndefined();
  });
});
