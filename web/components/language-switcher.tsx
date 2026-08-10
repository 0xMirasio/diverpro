"use client";

import { Globe2 } from "lucide-react";
import { localeNames, locales } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="language-switcher" aria-label="Language">
      <Globe2 size={16} aria-hidden="true" />
      {locales.map((item) => (
        <button
          className={locale === item ? "active" : ""}
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          aria-pressed={locale === item}
        >
          {localeNames[item]}
        </button>
      ))}
    </div>
  );
}
