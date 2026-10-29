import type { FormhausFormProps } from '@formhaus/react/cloud';
import type { ControlShellProps } from '@formhaus/react/controls';

export const shellField = (props: ControlShellProps) => props.f;
export const shellRoot = (props: ControlShellProps) => props.rootProps;
export const cloudLayout = (props: FormhausFormProps) => props.layout;
export const cloudComponents = (props: FormhausFormProps) => props.components;
export const cloudLocale = (props: FormhausFormProps) => props.locale;
