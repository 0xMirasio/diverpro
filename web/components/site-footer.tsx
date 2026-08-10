"use client";

import { Apple, Smartphone } from "lucide-react";
import { Brand } from "@/components/brand";
import { useLanguage } from "@/components/language-provider";
import { APP_VERSION } from "@/lib/app-version";
import { featureCopy } from "@/lib/features-i18n";

export function SiteFooter({ variant = "default" }: { variant?: "default" | "overlay" }) {
  const { locale } = useLanguage();
  const c = featureCopy(locale);

  return (
    <footer className={`site-footer ${variant}`}>
      <div className="footer-identity">
        <Brand compact />
        <p>{c.footerTagline}</p>
        <small className="footer-version">BlueMates WebApp version {APP_VERSION}</small>
        <small>© 2026 BlueMates · {c.footerRights}</small>
      </div>
      <div className="footer-apps">
        <span>{c.mobileApps}</span>
        <div>
          <button type="button" disabled>
            <Apple size={18} />
            <span><small>{c.comingSoon}</small><strong>{c.iosApp}</strong></span>
          </button>
          <button type="button" disabled>
            <Smartphone size={18} />
            <span><small>{c.comingSoon}</small><strong>{c.androidApp}</strong></span>
          </button>
        </div>
      </div>
    </footer>
  );
}
