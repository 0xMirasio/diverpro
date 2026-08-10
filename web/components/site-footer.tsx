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
  const [sourceCopied, setSourceCopied] = useState(false);
  const ipaUrl = "https://github.com/0xMirasio/diverpro/releases/download/ios-latest/BlueMates.ipa";
  const sourceUrl = "https://github.com/0xMirasio/diverpro/releases/download/ios-latest/bluemates-altstore.json";
  const addSourceUrl = `altstore://source?url=${encodeURIComponent(sourceUrl)}`;
  const directInstallUrl = `altstore://install?url=${encodeURIComponent(ipaUrl)}`;
  const sourceHelp = {
    en: { copy: "Copy the source URL", copied: "Source URL copied", prompt: "Copy this URL and paste it in AltStore → Sources → +", help: "If AltStore does not open, update AltStore Classic or copy this source URL and paste it in Sources → +." },
    fr: { copy: "Copier l’URL de la source", copied: "URL de la source copiée", prompt: "Copiez cette URL puis collez-la dans AltStore → Sources → +", help: "Si AltStore ne s’ouvre pas, mettez AltStore Classic à jour ou copiez cette URL puis collez-la dans Sources → +." },
    es: { copy: "Copiar la URL de la fuente", copied: "URL de la fuente copiada", prompt: "Copia esta URL y pégala en AltStore → Sources → +", help: "Si AltStore no se abre, actualiza AltStore Classic o copia esta URL y pégala en Sources → +." },
  }[locale];
  const copySourceUrl = async () => {
    try {
      await navigator.clipboard.writeText(sourceUrl);
      setSourceCopied(true);
      window.setTimeout(() => setSourceCopied(false), 2500);
    } catch {
      window.prompt(sourceHelp.prompt, sourceUrl);
    }
  };
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
            <button type="button" onClick={copySourceUrl}>{sourceCopied ? sourceHelp.copied : sourceHelp.copy}</button>
          </div>
          <small className="ios-download-help">{sourceHelp.help}</small>
          <small className="ios-download-help">{c.altStoreRequirement}</small>
        </section>
      </div>}
    </footer>
  );
}
