import { type ErrorSummaryComponentProps, FormActions, type FormActionsProps, FormRenderer } from '@formhaus/react';
import { CloudError, type CloudNotice as CloudNoticeData, type CloudNoticeActionFn } from '@formhaus/core/cloud';
import { CLOUD_NOTICE, cloudLabel, focusProblem, loadMessage, localNotice } from '@formhaus/core/internal';
import {
  type ComponentType,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { CloudNotice } from './CloudNotice';
import type { FormhausFormActionsProps, FormhausFormProps } from './types';
import { useCloudForm } from './useCloudForm';

const HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
} as const;

const CONTENTS = { display: 'contents' } as const;

interface ActionsSlot {
  Actions: ComponentType<FormhausFormActionsProps>;
  box: RefObject<HTMLDivElement | null> | null;
  notice: CloudNoticeData | null;
  view: ReactNode;
  act: CloudNoticeActionFn;
  legacy: boolean;
}

const ActionsContext = createContext<ActionsSlot | null>(null);

function CloudActions({ rootProps, ...props }: FormActionsProps) {
  const { Actions, box, notice, view, act, legacy } = useContext(ActionsContext)!;
  return (
    <>
      {box && <div ref={box} style={CONTENTS} />}
      {view}
      <Actions {...props} {...(!legacy && { rootProps })} notice={notice} onNoticeAction={act} />
    </>
  );
}

export function FormhausForm({
  id,
  apiBase,
  initialForm,
  draftStore,
  draftExclude,
  onSuccess,
  onError,
  fallback,
  success,
  initialValues,
  onFieldChange,
  actionsComponent,
  layout,
  cloudLabels,
  noticePlacement,
  noticeComponent: Notice,
  ...rendererProps
}: FormhausFormProps) {
  const trap = useRef<HTMLInputElement>(null);
  const extraBody = useCallback(() => ({ _fh_hp: trap.current?.value ?? '' }), []);
  const box = useRef<HTMLDivElement>(null);
  const cloud = useCloudForm({ id, apiBase, initialForm, draftStore, draftExclude, extraBody, challengeHost: box, onSuccess, onError });
  const root = useRef<HTMLDivElement | null>(null);
  const { warm } = cloud;
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      root.current?.removeEventListener('focusin', warm);
      root.current = node;
      node?.addEventListener('focusin', warm);
    },
    [warm],
  );
  const ready = !!cloud.challenge && !!cloud.definition && !cloud.done;
  useEffect(() => {
    if (ready) warm();
  }, [ready, cloud.revision, warm]);
  const act = useCallback<CloudNoticeActionFn>((action) => {
    if (action === 'reload') window.location.reload();
    else root.current?.querySelector('form')?.requestSubmit();
  }, []);
  const { redirectUrl, successMessage, allowAnother } = cloud.settings;
  const summaryCount = useRef(0);
  const slots = useMemo(() => {
    const Summary = layout?.errorSummary;
    const errorSummary =
      Summary &&
      ((props: ErrorSummaryComponentProps) => {
        summaryCount.current = props.count;
        return <Summary {...props} />;
      });
    return { ...layout, actions: CloudActions, errorSummary };
  }, [layout]);

  useEffect(() => {
    if (cloud.attempt === 0) return;
    const several = layout?.errorSummary && (() => summaryCount.current > 1);
    const frame = requestAnimationFrame(() => focusProblem(root.current, root.current?.querySelector<HTMLElement>(CLOUD_NOTICE), several));
    return () => cancelAnimationFrame(frame);
  }, [cloud.attempt]);

  useEffect(() => {
    if (cloud.done && redirectUrl && !success) window.location.assign(redirectUrl);
  }, [cloud.done, redirectUrl, success]);

  if (cloud.loadError)
    return (
      <div className="fh-cloud">
        <p role="alert" className="fh-form__error">
          {loadMessage(cloud.loadError, cloudLabels)}
        </p>
        {cloud.loadError instanceof CloudError && cloud.loadError.retryable && (
          <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={cloud.retry}>
            {cloudLabel(cloudLabels, 'retry')}
          </button>
        )}
      </div>
    );
  if (!cloud.definition)
    return (
      <div className="fh-cloud">
        <div className="fh-form" aria-busy="true">
          {fallback}
        </div>
      </div>
    );
  if (cloud.done)
    return (
      <div className="fh-cloud">
        {success ?? (
          <p role="status" className="fh-form__success">
            {successMessage ?? cloudLabel(cloudLabels, 'submitted')}
          </p>
        )}
        {allowAnother && (
          <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={cloud.again}>
            {cloudLabel(cloudLabels, 'submitAnother')}
          </button>
        )}
      </div>
    );
  const notice = localNotice(cloud.notice, cloudLabels);
  const view =
    notice && (Notice ? <Notice notice={notice} onAction={act} /> : <CloudNotice notice={notice} labels={cloudLabels} onAction={act} />);
  const top = noticePlacement !== 'actions';
  return (
    <div ref={attach} className="fh-cloud">
      <input ref={trap} name="_fh_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={HIDDEN} defaultValue="" />
      {top && view}
      <ActionsContext.Provider
        value={{
          Actions: layout?.actions ?? actionsComponent ?? FormActions,
          legacy: !layout?.actions && !!actionsComponent,
          box: cloud.challenge ? box : null,
          notice,
          view: top ? null : view,
          act,
        }}
      >
        <FormRenderer
          {...rendererProps}
          hiddenValues={undefined}
          key={cloud.revision}
          definition={cloud.definition}
          initialValues={cloud.initialValues ?? initialValues}
          errors={cloud.errors}
          onSubmit={cloud.submit}
          onError={cloud.relay}
          layout={slots}
          onFieldChange={(key, value, values) => {
            cloud.saveDraft(values);
            onFieldChange?.(key, value, values);
          }}
        />
      </ActionsContext.Provider>
    </div>
  );
}
