export type Theme = 'light' | 'dark'
export type ThemeMode = Theme | 'system'

export const THEME_KEY = 'yardbook-theme'
export const LOGIN_THEME_KEY = 'yardbook-login-theme'
const readMigrated=(key:string,legacy:string)=>{const current=localStorage.getItem(key);const value=current??localStorage.getItem(legacy);if(current===null&&value!==null)localStorage.setItem(key,value);return value}

export function getSavedTheme(): Theme { return readMigrated(THEME_KEY,'monkey-rentals-theme') === 'dark' ? 'dark' : 'light' }

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getSavedLoginThemeMode(): ThemeMode {
  const stored = readMigrated(LOGIN_THEME_KEY,'monkey-rentals-login-theme')
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

export function saveLoginThemeMode(mode: ThemeMode) {
  localStorage.setItem(LOGIN_THEME_KEY, mode)
}

export function resolveThemeMode(mode: ThemeMode): Theme {
  return mode === 'system' ? getSystemTheme() : mode
}

export function applyTheme(theme: Theme, options?: { persist?: boolean }) {
  document.documentElement.dataset.theme = theme
  if (options?.persist !== false) localStorage.setItem(THEME_KEY, theme)
}

export function applyLoginTheme(mode: ThemeMode) {
  applyTheme(resolveThemeMode(mode), { persist: false })
}
