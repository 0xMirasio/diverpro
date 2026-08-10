"use client";

import { useLanguage } from "@/components/language-provider";

export function AuthHero() {
  const { t } = useLanguage();
  return <div className="hero-copy" aria-hidden="true"><span className="depth-label">{t.heroEyebrow}</span><h1>{t.heroTitleLine1}<br />{t.heroTitleLine2}</h1><div className="depth-line"><span /></div></div>;
}
