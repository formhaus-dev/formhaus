import { forwardRef, useMemo } from 'react';
import { FormActions } from './FormActions';
import { FormStepProgress } from './FormStepProgress';
import { HeadlessFormRenderer } from './HeadlessFormRenderer';
import { withDefaultFields } from './defaultFieldComponents';
import type { FormRendererHandle, FormRendererProps } from './types';

export const FormRenderer = /* @__PURE__ */ forwardRef<FormRendererHandle, FormRendererProps>(function FormRenderer(
  { components, actionsComponent, progressComponent, ...props },
  ref,
) {
  const fieldComponents = useMemo(() => withDefaultFields(components), [components]);

  return (
    <HeadlessFormRenderer
      {...props}
      ref={ref}
      components={fieldComponents}
      actionsComponent={actionsComponent ?? FormActions}
      progressComponent={progressComponent ?? FormStepProgress}
    />
  );
});
