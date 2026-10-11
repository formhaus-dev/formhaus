import { inject, provide, type InjectionKey } from 'vue';
import type { BuilderForm } from '@formhaus/builder';

const key: InjectionKey<BuilderForm> = Symbol('builder-form');

export const provideBuilderForm = (form: BuilderForm) => provide(key, form);

export function useBuilderForm(): BuilderForm {
  const form = inject(key);
  if (!form) throw new Error('useBuilderForm needs a LandingBuilder parent');
  return form;
}
