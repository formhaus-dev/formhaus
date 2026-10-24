import type { ConfirmDialogComponentProps } from '@formhaus/react';
import sprite from '@uswds/uswds/img/sprite.svg';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function ConfirmDialog({ id, open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const modal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const page = document.getElementById('root');
    if (page) page.inert = true;
    cancelButton.current?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
      if (event.key !== 'Tab' || !modal.current) return;
      const focusable = [...modal.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      focusable.at((index + (event.shiftKey ? -1 : 1)) % focusable.length)?.focus();
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('keydown', keys);
      if (page) page.inert = false;
    };
  }, [open, cancel]);

  return createPortal(
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
        <div ref={modal} className="usa-modal" tabIndex={-1}>
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
    </div>,
    document.body,
  );
}
