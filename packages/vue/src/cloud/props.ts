import type { CloudLabelSource, CloudNotice, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import { formRendererProps } from '@formhaus/vue';
import type { PropType } from 'vue';

const { definition, onSubmit, errors, hiddenValues, ...rendererProps } = formRendererProps;
const cloudLabels = [Object, Function] as PropType<CloudLabelSource>;

export const formhausFormProps = {
  ...rendererProps,
  id: { type: String, required: true as const },
  apiBase: String,
  initialForm: Object as PropType<PublishedForm>,
  draftStore: { type: [Object, Boolean] as PropType<DraftStore | false>, default: undefined },
  draftExclude: Array as PropType<string[]>,
  cloudLabels,
  noticePlacement: String as PropType<'top' | 'actions'>,
};

export const cloudNoticeProps = {
  notice: { type: Object as PropType<CloudNotice>, required: true as const },
  labels: cloudLabels,
};
