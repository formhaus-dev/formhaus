import type { FieldOption } from '@formhaus/core';

export function OptionImage({ option }: { option: FieldOption }) {
  return option.image ? <img className="fh-field__option-image" src={option.image} alt="" loading="lazy" decoding="async" /> : null;
}
