import { FormRenderer } from '@formhaus/react';
import { CloudError, focusProblem, type CloudAction } from '@formhaus/core/cloud';
import { useCallback, useEffect, useRef } from 'react';
import { CloudNotice } from './CloudNotice';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

function handled() {}

export function FormhausForm({ id, apiBase, onSuccess, onError, fallback, success, initialValues, ...rendererProps }: FormhausFormProps) {
  const cloud = useCloudForm({ id, apiBase, onSuccess, onError });
  const root = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const act = useCallback((action: Exclude<CloudAction, null>) => {
    if (action === 'reload') window.location.reload();
    else root.current?.querySelector('form')?.requestSubmit();
  }, []);

  useEffect(() => {
    if (cloud.attempt === 0) return;
    const frame = requestAnimationFrame(() => focusProblem(root.current, notice.current));
    return () => cancelAnimationFrame(frame);
  }, [cloud.attempt]);

  if (cloud.loadError) return (
    <>
      <p role="alert" className="fh-form__error">{cloud.loadError.message}</p>
      {cloud.loadError instanceof CloudError && cloud.loadError.retryable && (
        <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={cloud.retry}>Try again</button>
      )}
    </>
  );
  if (!cloud.definition) return <div className="fh-form" aria-busy="true">{fallback}</div>;
  if (cloud.done) return <>{success ?? <p role="status" className="fh-form__success">Thank you. Your response was submitted.</p>}</>;
  return (
    <div ref={root} className="fh-cloud">
      <CloudNotice notice={cloud.notice} noticeRef={notice} onAction={act} />
      <FormRenderer
        {...rendererProps}
        key={cloud.revision}
        definition={cloud.definition}
        initialValues={cloud.initialValues ?? initialValues}
        errors={cloud.errors}
        onSubmit={cloud.submit}
        onError={handled}
      />
    </div>
  );
}
