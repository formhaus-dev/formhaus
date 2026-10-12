import { fieldDomId } from '@formhaus/core/internal';
import { useId, useMemo } from 'react';
import { withDefaultFields } from './defaultFieldComponents';
import { FieldResolver, type FieldResolverProps } from './FieldResolver';

export function FormhausField({ components, id, ...props }: FieldResolverProps) {
  const fallback = useId();
  const fieldComponents = useMemo(() => withDefaultFields(components), [components]);
  return <FieldResolver {...props} id={id ?? fieldDomId(fallback, props.field.key)} components={fieldComponents} />;
}
