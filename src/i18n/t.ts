import he from './he.json'

const dict = he as Record<string, string>

export function t(key: string, params?: Record<string, string | number>): string {
  let s = dict[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v))
    }
  }
  return s
}

export function hasKey(key: string): boolean {
  return key in dict
}

export { dict as heDict }
