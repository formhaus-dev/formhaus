import type { HeadConfig } from 'vitepress';

export type PromoVariant = 'cloud' | 'framework';

export function promoVariant(relativePath: string): PromoVariant | null {
  if (relativePath === 'framework.md') return 'framework';
  if (relativePath === 'index.md' || relativePath.startsWith('cloud/')) return 'cloud';
  return null;
}

export const promoKey = (variant: string) => `fh-promo-${variant}`;

export const promoHead: HeadConfig[] = [
  [
    'script',
    {},
    "try{var v=location.pathname.replace(/\\/$/,'')==='/framework'?'framework':'cloud';if(localStorage.getItem('fh-promo-'+v)==='1')document.documentElement.classList.add('fh-promo-off')}catch(e){}",
  ],
];
