import type { ControlOption } from '@formhaus/react/controls';
import { Radio, type RadioGroupProps } from 'antd';
import { Fragment, useContext } from 'react';
import { Inline } from './Shell';

export function Choices({ options, ...props }: Omit<RadioGroupProps, 'options'> & { options: ControlOption[] }) {
  const inline = useContext(Inline);
  const tiles = options.some((option) => option.image);
  return (
    <Radio.Group {...props} vertical={!tiles && !inline} className={tiles ? 'image-options' : undefined}>
      {options.map(({ value, label, image, reveal }) => (
        <Fragment key={value}>
          <Radio value={value} className={image ? 'image-option' : undefined} aria-controls={reveal?.id}>
            {image && <img src={image} alt="" className="image-option__image" />}
            {image ? <span>{label}</span> : label}
          </Radio>
          {reveal && (
            <div id={reveal.id} data-fh="reveal" hidden={!reveal.open} className="reveal">
              {reveal.children}
            </div>
          )}
        </Fragment>
      ))}
    </Radio.Group>
  );
}
