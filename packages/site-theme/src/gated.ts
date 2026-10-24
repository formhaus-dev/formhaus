import { computed } from 'vue';
import { useData } from 'vitepress';

export interface GatedLink {
  blog?: boolean;
}

export function useGatedLinks() {
  const { theme } = useData();
  const blog = computed(() => theme.value.blog === true);
  return <T extends GatedLink>(links: T[]) => links.filter((link) => !link.blog || blog.value);
}
