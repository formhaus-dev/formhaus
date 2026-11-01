import type { FormDefinition } from '@formhaus/core';
import { FormRenderer, useSubmitState } from '@formhaus/vue';
import { useFormDirty } from '@formhaus/vue/dirty';
import { h, ref } from 'vue';

declare const definition: FormDefinition;
const form = ref<InstanceType<typeof FormRenderer>>();
const status = useSubmitState(form);
const { markClean } = useFormDirty(form);

export const footer = () => [
  h(FormRenderer, { ref: status.ref, id: 'invite', definition, formErrorsPlacement: 'top', 'aria-label': 'Invite' }),
  h('button', { type: 'submit', form: 'invite', disabled: !status.canSubmit.value || status.submitting.value }, 'Send'),
  h('button', { type: 'button', onClick: markClean }, 'Keep'),
];
