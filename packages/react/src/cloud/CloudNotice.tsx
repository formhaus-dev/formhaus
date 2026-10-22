import type { CloudLabelSource, CloudNotice as Notice, CloudNoticeActionFn } from '@formhaus/core/cloud';
import { cloudLabel } from '@formhaus/core/internal';

export function CloudNotice({ notice, labels, onAction }: { notice: Notice; labels?: CloudLabelSource; onAction: CloudNoticeActionFn }) {
  return (
    <div tabIndex={-1} className={`fh-form__notice fh-form__notice--${notice.tone}`}>
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
          {cloudLabel(labels, notice.action)}
        </button>
      )}
    </div>
  );
}
