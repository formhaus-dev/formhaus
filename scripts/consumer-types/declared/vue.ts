import type { FormhausFormProps } from '@formhaus/vue/cloud';
import { controlShellProps } from '@formhaus/vue/controls';
import { useLocalizedForm } from '@formhaus/vue/i18n';
import { defineComponent, h } from 'vue';
import ControlShell from './ControlShell.vue';

export const Shell = defineComponent({ props: controlShellProps, setup: (props) => () => h('div', props.rootProps, props.f.label) });
export const shells = [ControlShell];
export const cloudLayout = (props: FormhausFormProps) => props.layout;
export const cloudComponents = (props: FormhausFormProps) => props.components;
export const localized = useLocalizedForm({ id: 'contact', title: 'Contact', fields: [], submit: { label: 'Send' } });
