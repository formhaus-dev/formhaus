import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createChallengeFrame } from '../../src/cloud';
import { challenge, flush, ORIGIN, page } from './fake-challenge';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('challenge frame', () => {
  it('creates nothing until it warms, then mounts one hidden frame', () => {
    const { host, frames } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    expect(frames).toHaveLength(0);
    frame.warm();
    frame.warm();
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ src: challenge.url, title: 'Bot check', tabIndex: -1, isConnected: true });
    expect(frames[0].attributes['aria-hidden']).toBe('true');
    expect(frames[0].style.cssText).toContain('opacity:0');
  });

  it('asks for a token after the frame loads, only from the challenge origin', async () => {
    const { host, last, reply } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    const token = frame.token();
    await flush();
    expect(last().contentWindow.postMessage).not.toHaveBeenCalled();
    last().onload!();
    await flush();
    expect(last().contentWindow.postMessage).toHaveBeenCalledWith(
      { type: 'formhaus:challenge-request', formId: 'abc', fresh: true },
      ORIGIN,
    );
    reply({ token: 'ts_1' });
    await expect(token).resolves.toBe('ts_1');
  });

  it('ignores messages from another origin, another window or another form', async () => {
    const { host, last, send, reply } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    const token = frame.token();
    last().onload!();
    send({ type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, 'https://evil.example');
    send({ type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, ORIGIN, {});
    send({ type: 'formhaus:challenge', formId: 'other', token: 'evil' });
    send({ type: 'formhaus:height', formId: 'abc', token: 'evil' });
    send('formhaus:challenge');
    send(null);
    reply({ token: 'ts_ok' });
    await expect(token).resolves.toBe('ts_ok');
  });

  it('rejects with a retryable verification error when the check fails', async () => {
    const { host, last, reply } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    const token = frame.token();
    last().onload!();
    reply({ error: 'bot check failed: 600010' });
    const error = await token.catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(CloudError);
    expect(error).toMatchObject({ code: 'verification_failed', action: 'retry' });
  });

  it('times out when the frame never answers', async () => {
    vi.useFakeTimers();
    const { host } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host, 1000);
    const token = frame.token();
    const settled = token.catch((thrown: unknown) => thrown);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await settled).toMatchObject({ code: 'verification_timeout', action: 'retry' });
  });

  it('runs the check again for every token and ignores late replies', async () => {
    const { host, frames, last, reply } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    const first = frame.token();
    last().onload!();
    reply({ error: 'bot check failed: 300030' });
    await first.catch(() => undefined);
    const second = frame.token();
    await flush();
    expect(last().contentWindow.postMessage).toHaveBeenCalledTimes(2);
    reply({ token: 'ts_2' });
    reply({ token: 'ts_late' });
    await expect(second).resolves.toBe('ts_2');
    expect(frames).toHaveLength(1);
  });

  it('shows the frame while Turnstile needs interaction and hides it after', () => {
    const { host, last, reply } = page();
    createChallengeFrame(challenge, 'abc', () => host).warm();
    reply({ height: 65 });
    expect(last().style.cssText).toContain('height:65px');
    expect(last().attributes['aria-hidden']).toBe('false');
    expect(last().tabIndex).toBe(0);
    expect(last().scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    reply({ height: 0 });
    expect(last().attributes['aria-hidden']).toBe('true');
    expect(last().tabIndex).toBe(-1);
  });

  it('mounts a new frame when the old one left the page and cleans up on dispose', () => {
    const { host, frames, listeners } = page();
    const frame = createChallengeFrame(challenge, 'abc', () => host);
    frame.warm();
    frames[0].remove();
    frame.warm();
    expect(frames).toHaveLength(2);
    expect(listeners.size).toBe(1);
    frame.dispose();
    expect(frames[1].isConnected).toBe(false);
    expect(listeners.size).toBe(0);
  });

  it('fails fast without a host element', async () => {
    const frame = createChallengeFrame(challenge, 'abc', () => null);
    await expect(frame.token()).rejects.toMatchObject({ code: 'verification_timeout' });
  });
});
