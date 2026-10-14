import type { HeadConfig } from 'vitepress'

type EventData = Record<string, string | number>

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => unknown }
  }
}

export const umamiWebsiteId = 'abeb3361-e26b-4aaf-a25c-ef868c82f9b6'

const respectGpc = 'window.fhBeforeSend=function(t,p){return navigator.globalPrivacyControl===true?false:p}'

export function analyticsHead(build: 'site' | 'docs'): HeadConfig[] {
  return [
    ['script', {}, respectGpc],
    ['script', {
      defer: '',
      src: '/s/script.js',
      'data-website-id': umamiWebsiteId,
      'data-domains': 'formhaus.dev',
      'data-tag': build,
      'data-do-not-track': 'true',
      'data-before-send': 'fhBeforeSend',
    }],
  ]
}

export function track(name: string, data?: EventData) {
  try {
    window.umami?.track(name, data)
  } catch {}
}
