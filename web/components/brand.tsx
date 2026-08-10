import { Waves } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="DiverPro">
      <span className="brand-mark"><Waves size={compact ? 18 : 22} strokeWidth={2.4} /></span>
      <span className="brand-name">Diver<span>Pro</span></span>
    </div>
  );
}
