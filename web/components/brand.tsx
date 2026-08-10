export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="BlueMates">
      <span className="brand-mark"><img src="/images/bluemates-turtle-logo.webp" width={compact ? 34 : 40} height={compact ? 34 : 40} alt="" /></span>
      <span className="brand-name">Blue<span>Mates</span></span>
    </div>
  );
}
