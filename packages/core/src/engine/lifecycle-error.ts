export class FormLifecycleError extends Error {
  readonly committed = true;
  readonly cause: unknown;

  constructor(readonly phase: 'afterStepChange' | 'afterSubmit', cause: unknown) {
    super(`The action completed, but ${phase} failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'FormLifecycleError';
    this.cause = cause;
  }
}

export async function afterCommit(phase: 'afterStepChange' | 'afterSubmit', callback: () => void | Promise<void>): Promise<void> {
  try { await callback(); }
  catch (error) { throw new FormLifecycleError(phase, error); }
}
