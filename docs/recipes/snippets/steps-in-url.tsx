'use client';

import type { FormDefinition, FormEvent } from '@formhaus/core';
import { FormRenderer, type FormRendererHandle } from '@formhaus/react';
import { useEffect, useRef, useState } from 'react';

const NOT_AVAILABLE = 'That step is not available yet. Finish this one first.';
const stepInUrl = () => decodeURIComponent(window.location.hash.slice(1));
const writeStep = (stepId: string, replace = false) =>
  window.history[replace ? 'replaceState' : 'pushState'](null, '', `#${encodeURIComponent(stepId)}`);

interface Props {
  definition: FormDefinition;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export function StepsInUrl({ definition, onSubmit }: Props) {
  const form = useRef<FormRendererHandle>(null);
  const syncing = useRef(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const open = () => {
      const requested = stepInUrl() || definition.steps?.[0]?.id;
      if (!form.current || !requested) return;
      syncing.current = true;
      const result = form.current.goToStep(requested);
      syncing.current = false;
      setNotice(result.reached ? '' : NOT_AVAILABLE);
      if (!result.reached && result.stepId) writeStep(result.stepId, true);
    };
    open();
    syncing.current = false;
    window.addEventListener('popstate', open);
    return () => window.removeEventListener('popstate', open);
  }, [definition]);

  const onFormEvent = (event: FormEvent) => {
    if (event.type !== 'step_viewed' || syncing.current || stepInUrl() === event.stepId) return;
    setNotice('');
    writeStep(event.stepId);
  };

  return (
    <>
      {notice && <p role="status">{notice}</p>}
      <FormRenderer ref={form} definition={definition} onSubmit={onSubmit} onFormEvent={onFormEvent} />
    </>
  );
}
