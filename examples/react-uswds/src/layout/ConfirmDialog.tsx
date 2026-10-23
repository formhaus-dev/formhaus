import type { ConfirmDialogComponentProps } from '@formhaus/react';
import sprite from '@uswds/uswds/img/sprite.svg';
import { useEffect, useRef } from 'react';

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelButton.current?.focus();
    const close = (event: KeyboardEvent) => event.key === 'Escape' && cancel();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, cancel]);

  return (
    <div
      id={id}
      className={open ? 'usa-modal-wrapper is-visible' : 'usa-modal-wrapper is-hidden'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      hidden={!open}
    >
      <div className="usa-modal-overlay">
        <div className="usa-modal" tabIndex={-1}>
          <div className="usa-modal__content">
            <div className="usa-modal__main">
              <h2 id={`${id}-title`} className="usa-modal__heading">
                {title}
              </h2>
              <p id={`${id}-description`}>{description}</p>
              <div className="usa-modal__footer">
                <ul className="usa-button-group">
                  <li className="usa-button-group__item">
                    <button type="button" className="usa-button usa-button--secondary" onClick={confirm}>
                      {confirmLabel}
                    </button>
                  </li>
                  <li className="usa-button-group__item">
                    <button ref={cancelButton} type="button" className="usa-button usa-button--unstyled" onClick={cancel}>
                      {cancelLabel}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <button type="button" className="usa-button usa-modal__close" aria-label={cancelLabel} onClick={cancel}>
              <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
                <use href={`${sprite}#close`} />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
