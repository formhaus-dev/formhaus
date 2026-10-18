import { getCurrentInstance } from 'vue';

export function useListening(): (...names: string[]) => boolean {
  const instance = getCurrentInstance();
  return (...names) => names.some((name) => !!instance?.vnode.props?.[name]);
}
