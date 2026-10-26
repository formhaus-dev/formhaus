import type { HeadConfig } from 'vitepress';

export type PromoVariant = 'cloud' | 'framework';

export function promoVariant(relativePath: string): PromoVariant | null {
  if (relativePath === 'index.md') return 'framework';
  if (relativePath === 'cloud.md' || relativePath.startsWith('cloud/')) return 'cloud';
  return null;
}

export const promoKey = (variant: string) => `fh-promo-${variant}`;

export const promoQuietMs = 7 * 24 * 60 * 60 * 1000;

export const promoHead: HeadConfig[] = [
  [
    'script',
    {},
    "try{var v=location.pathname.replace(/\\/$/,'')===''?'framework':'cloud';var t=Number(localStorage.getItem('fh-promo-'+v));if(t&&Date.now()-t<6048e5)document.documentElement.classList.add('fh-promo-off')}catch(e){}",
  ],
];
