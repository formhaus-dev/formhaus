import { describe, expect, it, vi } from 'vitest';
import { simulatePathTool } from '../src/simulate';
import { branching, linear, skippable } from './fixtures';

const ids = (result: Awaited<ReturnType<typeof simulatePathTool>>) => result.path?.map(({ id }) => id);

describe('simulate_path', () => {
  it('walks a linear form to submit', async () => {
    const result = await simulatePathTool({ definition: linear, answers: { name: 'Ada', email: 'ada@example.com' } });
    expect(ids(result)).toEqual(['name', 'email']);
    expect(result.currentStep).toEqual({ id: 'email', title: 'Email', index: 1 });
    expect(result.wouldSubmit).toBe(true);
    expect(result.submitValues).toEqual({ name: 'Ada', email: 'ada@example.com' });
  });

  it('stops at the first step that fails validation', async () => {
    const result = await simulatePathTool({ definition: linear, answers: {} });
    expect(result.currentStep?.id).toBe('name');
    expect(result.trace).toEqual([{ action: 'next', from: 'name', to: 'name', moved: false, errors: { name: 'This field is required' } }]);
    expect(result.errors).toEqual({ name: 'This field is required' });
    expect(result.path?.map(({ visited }) => visited)).toEqual([true, false]);
    expect(result.wouldSubmit).toBe(false);
  });

  it('follows the first matching route', async () => {
    const result = await simulatePathTool({ definition: branching, answers: { kind: 'business', company: 'Acme' } });
    expect(ids(result)).toEqual(['kind', 'business', 'review']);
    expect(result.path?.[1].visibleFields).toEqual(['company', 'vat']);
    expect(result.submitValues).toEqual({ kind: 'business', company: 'Acme' });
    expect(result.wouldSubmit).toBe(true);
  });

  it('falls back to the unconditional route and drops off-path answers', async () => {
    const result = await simulatePathTool({ definition: branching, answers: { kind: 'personal', name: 'Ada', company: 'Acme' } });
    expect(ids(result)).toEqual(['kind', 'personal', 'review']);
    expect(result.submitValues).toEqual({ kind: 'personal', name: 'Ada' });
  });

  it('ends the path on to: null', async () => {
    const result = await simulatePathTool({ definition: branching, answers: { kind: 'none' } });
    expect(ids(result)).toEqual(['kind']);
    expect(result.trace).toEqual([]);
    expect(result.wouldSubmit).toBe(true);
  });

  it('hides fields whose conditions do not match', async () => {
    const result = await simulatePathTool({ definition: branching, answers: { kind: 'business' } });
    expect(result.path?.[1].visibleFields).toEqual(['company']);
    expect(result.currentStep?.id).toBe('business');
  });

  it('skips a step and leaves its answers out', async () => {
    const result = await simulatePathTool({ definition: skippable, answers: { bio: 'Hi', phone: '1' }, actions: ['skip'] });
    expect(result.trace?.[0]).toEqual({ action: 'skip', from: 'about', to: 'contact', moved: true });
    expect(result.path?.[0].skipped).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.submitValues).toEqual({ phone: '1' });
  });

  it('submits when the last step is skipped', async () => {
    const result = await simulatePathTool({ definition: branching, answers: { kind: 'personal', name: 'Ada', notes: 'x' }, actions: ['next', 'next', 'skip'] });
    expect(result.trace?.[2]).toEqual({ action: 'skip', from: 'review', to: 'review', moved: false, submitted: true });
    expect(result.wouldSubmit).toBe(true);
    expect(result.submitValues).toEqual({ kind: 'personal', name: 'Ada' });
  });

  it('refuses skip on a step without a skip action', async () => {
    const result = await simulatePathTool({ definition: linear, answers: {}, actions: ['skip'] });
    expect(result.trace).toEqual([{ action: 'skip', from: 'name', to: 'name', moved: false, reason: 'Step has no skip action.' }]);
  });

  it('refuses next on a next: false step until its autoAdvance radio is answered', async () => {
    const blocked = await simulatePathTool({ definition: branching, answers: {}, actions: ['next'] });
    expect(blocked.trace?.[0]).toMatchObject({ moved: false, reason: expect.stringMatching(/next: false/) });
    const hidden = { ...linear, steps: [{ ...linear.steps[0], next: false }, linear.steps[1]] };
    const refused = await simulatePathTool({ definition: hidden, answers: { name: 'Ada' } });
    expect(refused.currentStep?.id).toBe('name');
    expect(refused.trace?.[0].reason).toMatch(/next: false/);
  });

  it('treats next on a next: false last step as the end of the path', async () => {
    const definition = { ...linear, steps: [linear.steps[0], { ...linear.steps[1], next: false }] };
    const result = await simulatePathTool({ definition, answers: { name: 'Ada', email: 'a@b.co' }, actions: ['next', 'next'] });
    expect(result.trace?.[1]).toEqual({ action: 'next', from: 'email', to: 'email', moved: false, reason: 'No next step on the active path.' });
    expect(result.wouldSubmit).toBe(true);
  });

  it('constructs the engine once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await simulatePathTool({ definition: { ...linear, steps: [{ ...linear.steps[0], show: [{ field: 'ghost', eq: 1 }] }, linear.steps[1]] } });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('applies back after next', async () => {
    const result = await simulatePathTool({ definition: linear, answers: { name: 'Ada' }, actions: ['next', 'back'] });
    expect(result.trace?.map(({ to }) => to)).toEqual(['email', 'name']);
    expect(result.wouldSubmit).toBe(false);
  });

  it('returns validation errors for an invalid definition', async () => {
    const result = await simulatePathTool({ definition: { id: 'x' } });
    expect(result.ok).toBe(false);
    expect(result.validation.valid).toBe(false);
  });

  it('handles single-page forms', async () => {
    const definition = { id: 'f', title: 'F', submit: { label: 'Send' }, fields: [{ key: 'a', type: 'text', label: 'A', validation: { required: true } }] };
    const result = await simulatePathTool({ definition, answers: {} });
    expect(result.multiStep).toBe(false);
    expect(result.errors).toEqual({ a: 'This field is required' });
    expect(result.wouldSubmit).toBe(false);
  });
});
