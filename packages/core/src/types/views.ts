import type { GoToStepResult } from './analytics';
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

export interface FormActionsView {
  submitAction?: FormAction;
  nextAction?: FormAction | false;
  backAction?: FormAction | false;
  cancelAction?: FormAction;
  skipAction?: FormAction;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  primaryLabel?: string;
  showPrimary?: boolean;
  showBack?: boolean;
  backLabel?: string;
  showSkip?: boolean;
  skipLabel?: string;
  loading?: boolean;
  values?: Record<string, unknown>;
  testIds?: Partial<Record<TestIdAction, string>>;
}

type TestIdAction = 'submit' | 'next' | 'back';

export type TestIdTarget =
  | { kind: 'form' | 'summary' | TestIdAction; definitionId: string }
  | { kind: 'field'; definitionId: string; key: string }
  | { kind: 'option'; definitionId: string; key: string; value: string };

type DerivedActionProps = 'primaryLabel' | 'showPrimary' | 'showBack' | 'backLabel' | 'showSkip' | 'skipLabel';

export type FormActionsState = Omit<FormActionsView, 'loading' | 'values' | 'testIds'> &
  Required<Pick<FormActionsView, DerivedActionProps>>;

export interface FormRendererHandle {
  setValue(key: string, value: unknown): void;
  getValues(): Record<string, unknown>;
  goToStep(stepId: string): GoToStepResult;
  readonly values: Readonly<Record<string, unknown>>;
}
