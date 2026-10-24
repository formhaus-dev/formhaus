import type { ScaleAnchor } from '@formhaus/core/fields';
import { toggleOption } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';
import { Checkboxes, Radios } from 'govuk-frontend';
import { type ChangeEvent, createContext, Fragment, useContext } from 'react';
import { useGovuk } from '../govuk';
import { PageContext } from '../page';

export const Anchors = createContext<(ScaleAnchor | undefined)[]>([]);

interface ChoicesProps {
  f: FieldProps;
  options: ControlOption[];
  value: unknown;
  onChange: (value: unknown) => void;
  multiple?: boolean;
  inline?: boolean;
}

export function Choices({ f, options, value, onChange, multiple, inline }: ChoicesProps) {
  const kind = multiple ? 'checkboxes' : 'radios';
  const anchors = useContext(Anchors);
  const stacked = useContext(PageContext).controllers.has(f.name);
  const ref = useGovuk(multiple ? Checkboxes : Radios);
  const tiles = options.some((option) => option.image);
  const revealing = options.some((option) => option.reveal);
  const className = [`govuk-${kind}`, inline && !stacked && !revealing && 'govuk-radios--inline', tiles && 'app-tiles']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} data-module={`govuk-${kind}`} ref={ref}>
      {options.map((option, index) => {
        const attrs = f.option({ ...option, value: String(option.value) }, index);
        const anchor = anchors.find((item) => item && String(item.point) === attrs.value);
        return (
          <Fragment key={option.value}>
            {multiple && option.exclusive && index > 0 && <div className="govuk-checkboxes__divider">or</div>}
            <div className={`govuk-${kind}__item`}>
              <input
                {...attrs}
                type={multiple ? 'checkbox' : 'radio'}
                className={`govuk-${kind}__input`}
                data-behaviour={multiple && option.exclusive ? 'exclusive' : undefined}
                aria-controls={option.reveal?.id}
                {...(multiple && { 'aria-expanded': option.reveal?.open })}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(multiple ? toggleOption(value, attrs.value) : event)}
              />
              <label className={`govuk-label govuk-${kind}__label`} htmlFor={attrs.id}>
                {option.image && <img src={option.image} alt="" className="app-tile__image" />}
                {anchor ? `${option.label} (${anchor.label.toLowerCase()})` : option.label}
              </label>
            </div>
            {option.reveal && (
              <div
                id={option.reveal.id}
                data-fh="reveal"
                hidden={!option.reveal.open}
                className={`govuk-${kind}__conditional${option.reveal.open ? '' : ` govuk-${kind}__conditional--hidden`}`}
              >
                {option.reveal.children}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
