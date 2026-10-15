import { FormRenderer } from '@formhaus/react';
import { CloudError, type CloudAction } from '@formhaus/core/cloud';
import { focusProblem } from '@formhaus/core/internal';
import { useCallback, useEffect, useRef } from 'react';
import { CloudNotice } from './CloudNotice';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
} as const;

function handled() {}

export function FormhausForm({
  id,
  apiBase,
  initialForm,
  draftStore,
  onSuccess,
  onError,
  fallback,
  success,
  initialValues,
  onFieldChange,
  ...rendererProps
}: FormhausFormProps) {
  const trap = useRef<HTMLInputElement>(null);
  const extraBody = useCallback(() => ({ _fh_hp: trap.current?.value ?? '' }), []);
  const cloud = useCloudForm({ id, apiBase, initialForm, draftStore, extraBody, onSuccess, onError });
  const root = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const act = useCallback((action: Exclude<CloudAction, null>) => {
    if (action === 'reload') window.location.reload();
    else root.current?.querySelector('form')?.requestSubmit();
  }, []);
  const { redirectUrl, successMessage, allowAnother } = cloud.settings;

  useEffect(() => {
    if (cloud.attempt === 0) return;
    const frame = requestAnimationFrame(() => focusProblem(root.current, notice.current));
    return () => cancelAnimationFrame(frame);
  }, [cloud.attempt]);

  useEffect(() => {
    if (cloud.done && redirectUrl && !success) window.location.assign(redirectUrl);
  }, [cloud.done, redirectUrl, success]);

  if (cloud.loadError)
    return (
      <>
        <p role="alert" className="fh-form__error">
          {cloud.loadError.message}
        </p>
        {cloud.loadError instanceof CloudError && cloud.loadError.retryable && (
          <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={cloud.retry}>
            Try again
          </button>
        )}
      </>
    );
  if (!cloud.definition)
    return (
      <div className="fh-form" aria-busy="true">
        {fallback}
      </div>
    );
  if (cloud.done)
    return (
      <>
        {success ?? (
          <p role="status" className="fh-form__success">
            {successMessage ?? 'Thank you. Your response was submitted.'}
          </p>
        )}
        {allowAnother && (
          <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={cloud.again}>
            Submit another response
          </button>
        )}
      </>
    );
  return (
    <div ref={root} className="fh-cloud">
      <input ref={trap} name="_fh_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={HIDDEN} defaultValue="" />
      <CloudNotice notice={cloud.notice} noticeRef={notice} onAction={act} />
      <FormRenderer
        {...rendererProps}
        key={cloud.revision}
        definition={cloud.definition}
        initialValues={cloud.initialValues ?? initialValues}
        errors={cloud.errors}
        onSubmit={cloud.submit}
        onError={handled}
        onFieldChange={(key, value, values) => {
          cloud.saveDraft(values);
          onFieldChange?.(key, value, values);
        }}
      />
    </div>
  );
}
