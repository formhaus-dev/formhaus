import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createChallengeFrame } from '../../src/cloud';
import { challenge, flush, ORIGIN, page } from './fake-challenge';

afterEach(() => vi.useRealTimers());

function ready(fake: ReturnType<typeof page>) {
  fake.last().onload!();
  return flush();
}

describe('challenge frame', () => {
  it('creates nothing until it warms, then mounts one hidden frame and a status region', () => {
    const fake = page();
    const frame = createChallengeFrame(challenge, 'abc', () => fake.host);
    expect(fake.frames).toHaveLength(0);
    frame.warm();
    frame.warm();
    expect(fake.frames).toHaveLength(1);
    expect(fake.frames[0]).toMatchObject({ src: challenge.url, title: 'Bot check', tabIndex: -1, isConnected: true });
    expect(fake.frames[0].attributes['aria-hidden']).toBe('true');
    expect(fake.frames[0].style.cssText).toContain('opacity:0');
    expect(fake.statuses[0]).toMatchObject({ isConnected: true, textContent: '', attributes: { role: 'status' } });
  });

  it('asks for a token after the frame loads, only from the challenge origin', async () => {
    const fake = page();
    const token = createChallengeFrame(challenge, 'abc', () => fake.host).token();
    await flush();
    expect(fake.requests()).toHaveLength(0);
    await ready(fake);
    expect(fake.last().contentWindow.postMessage).toHaveBeenCalledWith(
      { type: 'formhaus:challenge-request', formId: 'abc', id: 1, fresh: true },
      ORIGIN,
    );
    fake.reply({ token: 'ts_1' });
    await expect(token).resolves.toBe('ts_1');
  });

  it('ignores messages from another origin, window, form or request', async () => {
    const fake = page();
    const token = createChallengeFrame(challenge, 'abc', () => fake.host).token();
    await ready(fake);
    fake.send({ type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, 'https://evil.example');
    fake.send({ type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, ORIGIN, {});
    fake.send({ type: 'formhaus:challenge', formId: 'other', token: 'evil' });
    fake.send({ type: 'formhaus:height', formId: 'abc', token: 'evil' });
    fake.reply({ id: 7, token: 'stale' });
    fake.send('formhaus:challenge');
    fake.send(null);
    fake.reply({ id: 1, token: 'ts_ok' });
    await expect(token).resolves.toBe('ts_ok');
  });

  it('rejects with a verification error when the check fails', async () => {
    const fake = page();
    const token = createChallengeFrame(challenge, 'abc', () => fake.host).token();
    await ready(fake);
    fake.reply({ error: 'bot check failed: 600010' });
    const error = await token.catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(CloudError);
    expect(error).toMatchObject({ code: 'verification_failed', action: null });
  });

  it('reuses the token until it is spent or a check fails', async () => {
    const fake = page();
    const frame = createChallengeFrame(challenge, 'abc', () => fake.host);
    const first = frame.token();
    await ready(fake);
    fake.reply({ token: 'ts_1' });
    await first;
    const retry = frame.token();
    await flush();
    fake.reply({ token: 'ts_1' });
    await retry;
    frame.spend();
    const next = frame.token();
    await flush();
    fake.reply({ error: 'bot check failed: 300030' });
    await next.catch(() => undefined);
    const after = frame.token();
    await flush();
    fake.reply({ token: 'ts_2' });
    await expect(after).resolves.toBe('ts_2');
    expect(fake.requests().map((request) => request.fresh)).toEqual([true, false, true, true]);
    expect(fake.frames).toHaveLength(1);
  });

  it('gives up quietly when the frame never answers and stops asking', async () => {
    vi.useFakeTimers();
    const fake = page();
    const frame = createChallengeFrame(challenge, 'abc', () => fake.host, 40_000, 1000);
    const token = frame.token();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(token).resolves.toBeUndefined();
    await expect(frame.token()).resolves.toBeUndefined();
    expect(fake.frames).toHaveLength(1);
  });

  it('treats a Turnstile script that does not load as unavailable', async () => {
    const fake = page();
    const token = createChallengeFrame(challenge, 'abc', () => fake.host).token();
    await ready(fake);
    fake.reply({ error: 'turnstile did not load' });
    await expect(token).resolves.toBeUndefined();
  });

  it('waits for the user once the check asks for interaction, up to the timeout', async () => {
    vi.useFakeTimers();
    const fake = page();
    const token = createChallengeFrame(challenge, 'abc', () => fake.host, 5000, 1000).token();
    const settled = token.catch((thrown: unknown) => thrown);
    fake.last().onload!();
    await vi.advanceTimersByTimeAsync(500);
    fake.reply({ height: 65 });
    await vi.advanceTimersByTimeAsync(4500);
    expect(await settled).toMatchObject({ code: 'verification_timeout' });
  });

  it('shows the frame and announces it while Turnstile needs interaction', () => {
    const fake = page();
    createChallengeFrame(challenge, 'abc', () => fake.host).warm();
    fake.reply({ height: 65 });
    expect(fake.last().style.cssText).toContain('height:65px');
    expect(fake.last().style.cssText).toContain('color-scheme:normal');
    expect(fake.last().attributes['aria-hidden']).toBe('false');
    expect(fake.last().tabIndex).toBe(0);
    expect(fake.last().scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(fake.statuses[0].textContent).toBe('Complete the bot check to submit the form.');
    fake.reply({ height: 0 });
    expect(fake.last().attributes['aria-hidden']).toBe('true');
    expect(fake.last().tabIndex).toBe(-1);
    expect(fake.statuses[0].textContent).toBe('');
  });

  it('settles the pending request when a new one starts or on dispose', async () => {
    const fake = page();
    const frame = createChallengeFrame(challenge, 'abc', () => fake.host);
    const first = frame.token();
    const second = frame.token();
    await expect(first).rejects.toMatchObject({ code: 'verification_timeout' });
    frame.dispose();
    await expect(second).rejects.toMatchObject({ code: 'verification_timeout' });
    expect(fake.frames[0].isConnected).toBe(false);
    expect(fake.statuses[0].isConnected).toBe(false);
    expect(fake.listeners.size).toBe(0);
  });

  it('mounts a new frame when the old one left the page', () => {
    const fake = page();
    const frame = createChallengeFrame(challenge, 'abc', () => fake.host);
    frame.warm();
    fake.frames[0].remove();
    frame.warm();
    expect(fake.frames).toHaveLength(2);
    expect(fake.listeners.size).toBe(1);
  });

  it.each(['javascript:alert(1)', 'http://formhaus.cc/challenge', 'not a url'])('never loads %s', async (url) => {
    const fake = page();
    const frame = createChallengeFrame({ ...challenge, url }, 'abc', () => fake.host);
    frame.warm();
    await expect(frame.token()).resolves.toBeUndefined();
    expect(fake.frames).toHaveLength(0);
  });

  it('allows http for local hosts', () => {
    const fake = page();
    createChallengeFrame({ ...challenge, url: 'http://forms.localhost:8080/challenge?form=abc' }, 'abc', () => fake.host).warm();
    expect(fake.frames).toHaveLength(1);
  });
});
