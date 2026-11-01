import type { FieldOption } from '@formhaus/core';
import { optionDescriptionId } from '@formhaus/core/fields';
import { OptionImage } from './OptionImage';

export function OptionText({ option, id, variant }: { option: FieldOption; id: string; variant: 'radio' | 'multiselect' }) {
  return (
    <>
      <label className={`fh-field__${variant}-label`} htmlFor={id}>
        {option.label}
      </label>
      {option.description && (
        <span id={optionDescriptionId(id)} className="fh-field__option-description">
          {option.description}
        </span>
      )}
      <OptionImage option={option} />
    </>
  );
}
