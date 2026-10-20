export type StepRedirectReason = 'unknown-step' | 'not-on-path' | 'blocked';

export type FormEvent =
  | { type: 'form_viewed' }
  | { type: 'step_viewed'; stepId: string; stepIndex: number }
  | { type: 'field_focused'; fieldKey: string }
  | { type: 'field_blurred'; fieldKey: string; hasValue: boolean }
  | { type: 'field_error'; fieldKey: string; error: string }
  | { type: 'field_shown'; fieldKey: string }
  | { type: 'field_hidden'; fieldKey: string }
  | { type: 'step_completed'; stepId: string }
  | { type: 'step_skipped'; stepId: string }
  | { type: 'form_submitted'; fieldCount: number }
  | { type: 'form_submit_succeeded' }
  | { type: 'form_submit_failed'; reason: 'validation' | 'rejected' | 'error'; status?: number }
  | { type: 'step_redirected'; requestedStepId: string; stepId: string | null; reason: StepRedirectReason }
  | { type: 'form_reset' };
