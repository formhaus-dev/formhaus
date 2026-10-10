import { FormRenderer } from '@formhaus/react';
import type { FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

export function FormhausForm({ id, apiBase, onSuccess, fallback, success, ...rendererProps }: FormhausFormProps) {
  const { definition, loadError, errors, done, submit } = useCloudForm({ id, apiBase, onSuccess, onError: rendererProps.onError });
  if (loadError) return <p role="alert" className="fh-form__error">{loadError.message}</p>;
  if (!definition) return <div className="fh-form" aria-busy="true">{fallback}</div>;
  if (done) return <>{success ?? <p role="status" className="fh-form__success">Thank you. Your response was submitted.</p>}</>;
  return <FormRenderer {...rendererProps} definition={definition} errors={errors} onSubmit={submit} />;
}
