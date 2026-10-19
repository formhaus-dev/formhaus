import type { FieldOption } from '@formhaus/core';
import { useContext, useRef, useState } from 'react';
import { LabelContext } from '../labels';

let pressed: EventTarget | null = null;

export function OptionImage({ option: { image, label } }: { option: FieldOption }) {
  const text = useContext(LabelContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState<string>();
  const close = () => dialog.current?.close();
  if (!image) return null;
  return failed === image ? (
    <span className="fh-field__option-image" />
  ) : (
    <>
      <img
        className="fh-field__option-image"
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(image)}
      />
      <button
        ref={trigger}
        type="button"
        className="fh-field__option-zoom"
        aria-label={text('enlargeImage', { label })}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          dialog.current?.toggleAttribute('data-pointer', event.detail > 0);
          dialog.current?.showModal();
        }}
      />
      <dialog
        ref={dialog}
        className="fh-dialog fh-dialog--image"
        aria-label={label}
        onClose={() => trigger.current?.focus()}
        onPointerDown={(event) => {
          pressed = event.target;
        }}
        onClick={(event) => event.target === event.currentTarget && pressed === event.target && close()}
        onKeyDown={(event) => {
          event.stopPropagation();
          event.currentTarget.removeAttribute('data-pointer');
        }}
      >
        <div className="fh-dialog__header">
          <p className="fh-dialog__title">{label}</p>
          <button type="button" className="fh-dialog__close" aria-label={text('close')} onClick={close} />
        </div>
        <img className="fh-dialog__image" src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </dialog>
    </>
  );
}
