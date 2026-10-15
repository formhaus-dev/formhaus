import { useMemo } from 'react';
import { FormActions } from './FormActions';
import { FormStepProgress } from './FormStepProgress';
import { HeadlessFormRenderer } from './HeadlessFormRenderer';
import { withDefaultFields } from './defaultFieldComponents';
import type { FormRendererProps } from './types';

export function FormRenderer({ components, actionsComponent, progressComponent, ...props }: FormRendererProps) {
  const fieldComponents = useMemo(() => withDefaultFields(components), [components]);

  return (
    <HeadlessFormRenderer
      {...props}
      components={fieldComponents}
      actionsComponent={actionsComponent ?? FormActions}
      progressComponent={progressComponent ?? FormStepProgress}
    />
  );
}
