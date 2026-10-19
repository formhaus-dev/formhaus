import type { FieldOption } from '@formhaus/core';
import { useRef } from 'react';

export function OptionImage({ option: { image, label } }: { option: FieldOption }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => dialog.current?.close();
  return image ? (
    <>
      <img className="fh-field__option-image" src={image} alt="" loading="lazy" decoding="async" />
      <button
        ref={trigger}
        type="button"
        className="fh-field__option-zoom"
        aria-label={`Enlarge image: ${label}`}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          dialog.current?.showModal();
        }}
      />
      <dialog
        ref={dialog}
        className="fh-dialog fh-dialog--image"
        aria-label={label}
        onClose={() => trigger.current?.focus()}
        onClick={(event) => event.target === event.currentTarget && close()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="fh-dialog__header">
          <p className="fh-dialog__title">{label}</p>
          <button type="button" className="fh-dialog__close" aria-label="Close" onClick={close} />
        </div>
        <img className="fh-dialog__image" src={image} alt="" loading="lazy" />
      </dialog>
    </>
  ) : null;
}
