import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  type LanguageCode,
} from "./languages"

async function loadLocale(lang: LanguageCode) {
  const locale = await import(`../locales/${lang}.json`)
  return locale.default
}

export async function initI18n(defaultLang = DEFAULT_LANGUAGE) {
  const resources = {
    [defaultLang]: {
      translation: await loadLocale(defaultLang),
    },
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: defaultLang,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
  })

  return i18n
}

export function checkLanguage(lang: unknown): lang is LanguageCode {
  return LANGUAGE_CODES.includes(lang as LanguageCode)
}

export async function changeLanguage(lang: unknown) {
  if (!checkLanguage(lang)) {
    return
  }

  if (!i18n.hasResourceBundle(lang, "translation")) {
    const newLocale = await import(`../locales/${lang}.json`)
    i18n.addResourceBundle(lang, "translation", newLocale.default)
  }
  await i18n.changeLanguage(lang)
}

export default i18n
