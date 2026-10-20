import type { FormAction } from './action';
import type { FormGroup, FormSection } from './field';

export interface SectionView {
  id: string;
  section: FormSection;
  title: string;
  description?: string;
  descriptionId?: string;
}

export interface GroupItemView {
  id: string;
  index: number;
  title: string;
  titleId: string;
  canRemove: boolean;
  remove: () => void;
  requestRemove: () => void;
  hasContent: boolean;
  removeLabel: string;
  removeName: string;
  disabled?: boolean;
}

export interface ConfirmDialogView {
  id: string;
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirm: () => void;
  cancel: () => void;
}

export interface GroupView<TItem extends GroupItemView = GroupItemView> {
  id: string;
  group: FormGroup;
  label: string;
  helperText?: string;
  error?: string;
  describedBy?: string;
  items: TItem[];
  canAdd: boolean;
  add: () => void;
  remove: (id: string) => void;
  requestRemove: (id: string) => void;
  addLabel: string;
  removeLabel: string;
  disabled?: boolean;
  status: string;
}

export interface FormActionsState {
  submitAction?: FormAction;
  nextAction?: FormAction | false;
  backAction?: FormAction | false;
  cancelAction?: FormAction;
  skipAction?: FormAction;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  primaryLabel: string;
  showPrimary: boolean;
  showBack: boolean;
  backLabel: string;
  showSkip: boolean;
  skipLabel: string;
}

type DerivedActionProps = 'primaryLabel' | 'showPrimary' | 'showBack' | 'backLabel' | 'showSkip' | 'skipLabel';

export interface FormActionsView extends Omit<FormActionsState, DerivedActionProps>, Partial<Pick<FormActionsState, DerivedActionProps>> {
  loading?: boolean;
  values?: Record<string, unknown>;
}

export interface FormRendererHandle {
  setValue(key: string, value: unknown): void;
  getValues(): Record<string, unknown>;
  readonly values: Readonly<Record<string, unknown>>;
}
