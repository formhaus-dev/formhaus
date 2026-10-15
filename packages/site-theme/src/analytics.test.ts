import { describe, expect, it } from 'vitest'
import { codeLanguage, landingSource, trackingAllowed, withSource } from './analytics'

describe('landingSource', () => {
  it('keeps campaign parameters and the ref', () => {
    expect(landingSource('https://formhaus.dev/?utm_source=hn&utm_campaign=2026-10-launch&ref=f_abc&q=x', '')).toEqual({
      utm_source: 'hn',
      utm_campaign: '2026-10-launch',
      ref: 'f_abc',
    })
  })

  it('falls back to the referring host, never formhaus.dev itself', () => {
    expect(landingSource('https://formhaus.dev/', 'https://news.ycombinator.com/item?id=1')).toEqual({ ref: 'news.ycombinator.com' })
    expect(landingSource('https://formhaus.dev/cloud', 'https://formhaus.dev/')).toEqual({})
    expect(landingSource('https://formhaus.dev/cloud', 'https://app.formhaus.dev/login')).toEqual({})
  })
})

describe('withSource', () => {
  const source = { utm_source: 'hn', ref: 'readme' }

  it('adds the source and the CTA location to sign-up links', () => {
    expect(withSource('https://app.formhaus.dev/login', source, 'hero')).toBe('https://app.formhaus.dev/login?utm_source=hn&ref=readme&from=hero')
    expect(withSource('https://app.formhaus.dev/forms/new?template=contact-form', source)).toBe(
      'https://app.formhaus.dev/forms/new?template=contact-form&utm_source=hn&ref=readme',
    )
  })

  it('keeps parameters the link already has and leaves other links alone', () => {
    expect(withSource('https://app.formhaus.dev/login?ref=nav', source)).toBe('https://app.formhaus.dev/login?ref=nav&utm_source=hn')
    expect(withSource('https://formhaus.dev/cloud', source, 'hero')).toBeNull()
    expect(withSource('https://app.formhaus.dev/usage', source)).toBeNull()
  })
})

describe('trackingAllowed', () => {
  it('honours Do Not Track and Global Privacy Control', () => {
    expect(trackingAllowed({ doNotTrack: null, globalPrivacyControl: false })).toBe(true)
    expect(trackingAllowed({ doNotTrack: '1' })).toBe(false)
    expect(trackingAllowed({ doNotTrack: null, globalPrivacyControl: true })).toBe(false)
  })
})

describe('codeLanguage', () => {
  it('reads the language of the code block, not its text', () => {
    const button = (className: string) => ({ parentElement: { className } }) as unknown as Element
    expect(codeLanguage(button('language-tsx vp-adaptive-theme active'))).toBe('tsx')
    expect(codeLanguage(button('vp-code'))).toBe('text')
  })
})
