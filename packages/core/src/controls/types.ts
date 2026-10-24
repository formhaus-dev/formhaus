import type { FieldOption, FieldType } from '../types';

export type ControlKind = 'input' | 'inline' | 'group';

export type ControlShells<Shell> = Shell | null | Partial<Record<ControlKind, Shell | null>>;

export type ControlTextType = 'text' | 'email' | 'phone' | 'number' | 'password' | 'date' | 'time' | 'datetime';

export type ControlOption = Omit<FieldOption, 'value'> & { value: string | number };

export type ControlEntryOf<Component, View> =
  | Component
  | readonly [Component, string | ((f: View, options: ControlOption[]) => object) | null, string?];

type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;

type LooseValue<T> = T extends (...args: never) => unknown ? T : T extends object ? { [Key in keyof T]?: Widen<T[Key]> } : Widen<T>;

export type LooseProps<T> = { [Key in keyof T]?: LooseValue<T[Key]> };

export type MappedTypes<Controls> = Exclude<keyof Controls, 'input'> | ('input' extends keyof Controls ? ControlTextType : never);

export interface MapControlsOptions<Shell, View, Matrix, Controls> {
  shell: ControlShells<Shell>;
  labels?: (f: View) => object;
  kinds?: Partial<Record<FieldType, ControlKind>>;
  matrix?: Matrix;
  controls: Controls;
}
