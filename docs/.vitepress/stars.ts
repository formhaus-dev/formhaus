import { repoUrl } from './site'

const apiUrl = repoUrl.replace('https://github.com/', 'https://api.github.com/repos/')

export async function fetchStarCount(): Promise<number | null> {
  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(4000)
    })
    if (!response.ok) return null
    const { stargazers_count: count } = await response.json()
    return Number.isInteger(count) && count >= 0 ? count : null
  } catch {
    return null
  }
}

export function formatStarCount(count: number): string {
  if (count < 1000) return String(count)
  return `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, '')}k`
}
