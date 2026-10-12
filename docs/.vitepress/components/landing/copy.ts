import { ref } from 'vue';

export function useCopy() {
  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => { copied.value = false; }, 2000);
    } catch {
      copied.value = false;
    }
  }

  return { copied, copy };
}
