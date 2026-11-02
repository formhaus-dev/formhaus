import type { FormDefinition } from '@formhaus/core';
import { schemaParse, type StandardSchemaV1 } from '@formhaus/core/schema';
import { FormRenderer, type FormRendererProps, HeadlessFormRenderer, useFormEngine, useSubmitState } from '@formhaus/react';
import { useFormDirty } from '@formhaus/react/dirty';

declare const definition: FormDefinition;
declare const schema: StandardSchemaV1<{ name: string }>;
const parsed = schemaParse(schema);
const { validate, submit } = parsed;

type DialogFormProps = Omit<FormRendererProps<{ name: string }>, 'className'>;

export function DialogForm(props: DialogFormProps) {
  const status = useSubmitState();
  const dirty = useFormDirty();
  return (
    <>
      <HeadlessFormRenderer
        {...props}
        ref={(handle) => {
          status.ref(handle);
          dirty.ref(handle);
        }}
        aria-labelledby="dialog-title"
        data-dialog="invite"
        style={{ gap: 8 }}
      />
      <button type="submit" form={props.id} disabled={!status.canSubmit || status.validating}>
        {status.submitting ? 'Saving' : 'Save'}
      </button>
      <button type="button" onClick={dirty.markClean} disabled={!dirty.dirty}>
        Keep
      </button>
    </>
  );
}

export function SchemaForm() {
  useSubmitState(useFormEngine(definition));
  return (
    <FormRenderer definition={definition} aria-label="Profile" onValidate={validate} onSubmit={submit((values) => void values.name)} />
  );
}
