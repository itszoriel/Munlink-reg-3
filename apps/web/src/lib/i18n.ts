import { create } from 'zustand'

/**
 * Two-language support (English / Filipino) without a translation framework.
 *
 * Strings are written in place as pairs: t('Request a document', 'Humiling ng dokumento').
 * Keeping both languages side by side makes them easy for a reviewer to check,
 * and a missing translation can never break the page.
 */
export type Lang = 'en' | 'fil'

const STORAGE_KEY = 'munlink:lang'

function readStoredLang(): Lang {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'en' || value === 'fil') return value
  } catch {
    // Storage unavailable (private mode); fall back to English.
  }
  return 'en'
}

function applyDocumentLang(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'fil' ? 'fil' : 'en'
}

type LangState = { lang: Lang; setLang: (lang: Lang) => void }

export const useLangStore = create<LangState>((set) => ({
  lang: readStoredLang(),
  setLang: (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
    applyDocumentLang(lang)
    set({ lang })
  },
}))

applyDocumentLang(useLangStore.getState().lang)

export function useLang() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const t = (en: string, fil: string) => (lang === 'fil' ? fil : en)
  return { lang, setLang, t }
}

/** Peso amount with two decimals, e.g. ₱1,250.00 */
export function formatPeso(amount: number) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
