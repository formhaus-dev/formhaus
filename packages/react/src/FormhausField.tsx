import { useMemo } from 'react';
import { withDefaultFields } from './defaultFieldComponents';
import { FieldResolver, type FieldResolverProps } from './FieldResolver';

export function FormhausField({ components, ...props }: FieldResolverProps) {
  const fieldComponents = useMemo(() => withDefaultFields(components), [components]);
  return <FieldResolver {...props} components={fieldComponents} />;
}
