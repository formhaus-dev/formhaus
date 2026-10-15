import type { CloudAction, CloudNotice as Notice } from '@formhaus/core/cloud';
import type { Ref } from 'react';

const LABELS = { retry: 'Try again', reload: 'Reload page' };

export function CloudNotice({
  notice,
  noticeRef,
  onAction,
}: {
  notice: Notice | null;
  noticeRef: Ref<HTMLDivElement>;
  onAction: (action: Exclude<CloudAction, null>) => void;
}) {
  if (!notice) return null;
  return (
    <div ref={noticeRef} tabIndex={-1} className={`fh-form__notice fh-form__notice--${notice.tone}`}>
      <p>{notice.message}</p>
      {notice.details.length > 0 && (
        <ul>
          {notice.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {notice.action && (
        <button
          type="button"
          className="fh-form-actions__button fh-form-actions__button--secondary"
          onClick={() => onAction(notice.action!)}
        >
          {LABELS[notice.action]}
        </button>
      )}
    </div>
  );
}
