import type { FormStep } from '../types';
import { isVisible } from './is-visible';

export const isStepVisible: (step: FormStep, values: Record<string, unknown>) => boolean = isVisible;
