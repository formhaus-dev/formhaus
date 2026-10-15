import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext, Theme } from 'vitepress'
import GithubStar from './GithubStar.vue'
import NavCta from './NavCta.vue'
import LpNav from './LpNav.vue'
import './landing-nav.css'
import DocsDrawerMenu from './DocsDrawerMenu.vue'
import { ownerOf } from './routes.js'
import './brand.css'
import './docs-menu.css'

import { startAnalytics } from './analytics'

export { track } from './analytics'

function stayInOwnBuild({ router }: EnhanceAppContext) {
  if (typeof window === 'undefined') return
  let initial = true
  router.onBeforePageLoad = (href) => {
    const url = new URL(href, window.location.href)
    if (initial || ownerOf(url.pathname) === ownerOf(router.route.path)) {
      initial = false
      return
    }
    window.location.replace(url.href)
    return false
  }
}

export function createTheme(enhance?: (context: EnhanceAppContext) => void): Theme {
  return {
    extends: DefaultTheme,
    Layout: () =>
      h(DefaultTheme.Layout, null, {
        'nav-bar-content-before': () => h(LpNav),
        'nav-bar-content-after': () => [h(GithubStar), h(NavCta)],
        'nav-screen-content-before': () => [h(NavCta, { mobile: true }), h(LpNav, { mobile: true })],
        'nav-screen-content-after': () => h(DocsDrawerMenu),
      }),
    enhanceApp(context) {
      stayInOwnBuild(context)
      startAnalytics()
      enhance?.(context)
    },
  }
}
