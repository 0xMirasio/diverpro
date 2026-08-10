"use client";

import { Apple, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { useLanguage } from "@/components/language-provider";
import { APP_VERSION } from "@/lib/app-version";
import { featureCopy } from "@/lib/features-i18n";

export function SiteFooter({ variant = "default" }: { variant?: "default" | "overlay" }) {
  const { locale } = useLanguage();
  const c = featureCopy(locale);
  const [showIos, setShowIos] = useState(false);
  const ipaUrl = "https://github.com/0xMirasio/diverpro/releases/download/ios-latest/BlueMates.ipa";
  const sourceUrl = "https://github.com/0xMirasio/diverpro/releases/download/ios-latest/bluemates-altstore.json";
  const addSourceUrl = `altstore-classic://source?url=${encodeURIComponent(sourceUrl)}`;
  const directInstallUrl = `altstore-classic://install?url=${encodeURIComponent(ipaUrl)}`;
  useEffect(() => {
    if (!showIos) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setShowIos(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showIos]);

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
          <button type="button" className="ios-ready" onClick={() => setShowIos(true)}>
            <Apple size={18} />
            <span><small>{c.iosAvailable}</small><strong>{c.iosApp}</strong></span>
          </button>
          <button type="button" disabled>
            <Smartphone size={18} />
            <span><small>{c.comingSoon}</small><strong>{c.androidApp}</strong></span>
          </button>
        </div>
      </div>
      {showIos && <div className="ios-download-backdrop" role="presentation" onMouseDown={() => setShowIos(false)}>
        <section className="ios-download-modal" role="dialog" aria-modal="true" aria-labelledby="ios-download-title" onMouseDown={(event) => event.stopPropagation()}>
          <button type="button" className="ios-download-close" onClick={() => setShowIos(false)} aria-label={c.close}>×</button>
          <span className="ios-download-icon"><Apple size={30} /></span>
          <small>BlueMates iOS 1.0.0</small>
          <h2 id="ios-download-title">{c.iosDownloadTitle}</h2>
          <p>{c.iosDownloadText}</p>
          <div className="ios-download-actions">
            <a className="primary" href={addSourceUrl}>{c.addAltStoreSource}</a>
            <a href={directInstallUrl}>{c.directAltStoreInstall}</a>
            <a href={ipaUrl}>{c.downloadIpa}</a>
          </div>
          <small className="ios-download-help">{c.altStoreRequirement}</small>
        </section>
      </div>}
    </footer>
  );
}
