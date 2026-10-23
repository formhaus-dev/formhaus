import { forwardRef, useMemo } from 'react';
import { FormActions } from './FormActions';
import { FormStepProgress } from './FormStepProgress';
import { HeadlessFormRenderer } from './HeadlessFormRenderer';
import { withDefaultFields } from './defaultFieldComponents';
import type { FormRendererHandle, FormRendererProps } from './types';

export const FormRenderer = /* @__PURE__ */ forwardRef<FormRendererHandle, FormRendererProps>(function FormRenderer(
  { components, layout, ...props },
  ref,
) {
  const { actionsComponent, progressComponent } = props;
  const fieldComponents = useMemo(() => withDefaultFields(components), [components]);
  const slots = useMemo(
    () => ({
      ...layout,
      actions: layout?.actions ?? (actionsComponent ? undefined : FormActions),
      progress: layout?.progress ?? (progressComponent ? undefined : FormStepProgress),
    }),
    [layout, actionsComponent, progressComponent],
  );

  return <HeadlessFormRenderer {...props} ref={ref} components={fieldComponents} layout={slots} />;
});
