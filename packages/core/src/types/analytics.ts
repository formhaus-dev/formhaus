export type FormEvent =
  | { type: 'form_viewed' }
  | { type: 'step_viewed'; stepId: string; stepIndex: number }
  | { type: 'field_focused'; fieldKey: string }
  | { type: 'field_blurred'; fieldKey: string; hasValue: boolean }
  | { type: 'field_error'; fieldKey: string; error: string }
  | { type: 'step_completed'; stepId: string }
  | { type: 'step_skipped'; stepId: string }
  | { type: 'form_submitted'; fieldCount: number }
  | { type: 'form_submit_succeeded' }
  | { type: 'form_submit_failed'; reason: 'rejected' | 'error' }
  | { type: 'form_reset' };

export type FormAnalyticsEvent = FormEvent;
