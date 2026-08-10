"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionary, type Locale, locales } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof dictionary>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("diverpro_locale") as Locale | null;
    const browser = window.navigator.language.slice(0, 2) as Locale;
    const next = saved && locales.includes(saved) ? saved : locales.includes(browser) ? browser : "en";
    const timer = window.setTimeout(() => {
      document.documentElement.lang = next;
      setLocaleState(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLocale = (next: Locale) => {
    window.localStorage.setItem("diverpro_locale", next);
    document.documentElement.lang = next;
    setLocaleState(next);
  };

  const value = useMemo(() => ({ locale, setLocale, t: dictionary(locale) }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
